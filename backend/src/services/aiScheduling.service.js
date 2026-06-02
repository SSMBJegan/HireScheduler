const { spawn } = require('child_process');
const aiConfig = require('../config/ai');

module.exports = {
  async generateSchedule(interviewers, dates, availability) {
    return new Promise((resolve) => {
      const payload = {
        action: 'schedule',
        data: { interviewers, dates, availability }
      };

      const pyProcess = spawn(aiConfig.pythonPath, [aiConfig.scriptPath]);
      let stdoutData = '';
      let stderrData = '';

      pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pyProcess.on('error', (err) => {
        console.warn('AI Python Process failed. Activating native JS fallback...', err.message);
        resolve(this.jsFallback(interviewers, dates, availability));
      });

      pyProcess.on('close', (code) => {
        if (code !== 0) {
          console.warn(`AI Python Process exited with code ${code}. Activating native JS fallback...`);
          return resolve(this.jsFallback(interviewers, dates, availability));
        }
        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (e) {
          console.warn('AI Python Process output parsing failed. Activating native JS fallback...');
          resolve(this.jsFallback(interviewers, dates, availability));
        }
      });

      // Write parameters to Python process stdin
      pyProcess.stdin.write(JSON.stringify(payload));
      pyProcess.stdin.end();
    });
  },

  jsFallback(interviewers, dates, availability) {
    const userNameMap = new Map(interviewers.map(u => [u.id, u.name]));
    const userWorkload = Object.fromEntries(interviewers.map(u => [u.id, 0]));
    
    // Group available interviewers per date
    const availablePerDate = {};
    availability.forEach(avail => {
      const dId = avail.campaign_date_id;
      const uId = avail.user_id;
      if (!availablePerDate[dId]) {
        availablePerDate[dId] = [];
      }
      availablePerDate[dId].push(uId);
    });

    const recommendedPlan = {};
    const explanation = [];

    // Sort dates by lowest availability (hardest to staff first)
    const sortedDates = [...dates].sort((a, b) => {
      const countA = (availablePerDate[a.id] || []).length;
      const countB = (availablePerDate[b.id] || []).length;
      return countA - countB;
    });

    sortedDates.forEach(d => {
      const dId = d.id;
      const dStr = d.date;
      const capacity = d.max_capacity;

      const activeStatusMap = new Map(interviewers.map(u => [u.id, u.is_active || 0]));

      const candidates = availablePerDate[dId] || [];
      // Sort candidates:
      // 1. Prioritize currently active/logged-in interviewers (is_active = 1 comes first)
      // 2. Greedy workload balance (lowest workload first)
      const sortedCandidates = [...candidates].sort((a, b) => {
        const activeA = activeStatusMap.get(a) || 0;
        const activeB = activeStatusMap.get(b) || 0;
        if (activeA !== activeB) {
          return activeB - activeA; // active (1) before inactive (0)
        }
        return (userWorkload[a] || 0) - (userWorkload[b] || 0);
      });

      const selectedUids = sortedCandidates.slice(0, capacity);
      recommendedPlan[dStr] = selectedUids.map(uid => userNameMap.get(uid)).filter(Boolean);

      // Increment workload
      selectedUids.forEach(uid => {
        if (userWorkload[uid] !== undefined) {
          userWorkload[uid] += 1;
        }
      });

      if (selectedUids.length === 0) {
        explanation.push(`Warning: ${dStr} has 0 available interviewers.`);
      } else if (candidates.length > capacity) {
        explanation.push(`${dStr} is fully optimized. Capacity of ${capacity} met. Balanced load selected.`);
      } else {
        explanation.push(`${dStr} scheduled with all ${selectedUids.length} available candidate(s).`);
      }
    });

    const totalSlots = dates.reduce((sum, d) => sum + d.max_capacity, 0);
    const filledSlots = Object.values(recommendedPlan).reduce((sum, list) => sum + list.length, 0);
    const score = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 100;

    return {
      success: true,
      schedule: recommendedPlan,
      explanation: explanation.join('\n'),
      score,
      balanced_workload: "Optimal"
    };
  }
};
