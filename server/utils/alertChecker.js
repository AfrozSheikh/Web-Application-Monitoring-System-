const Log = require('../models/Log');
const Alert = require('../models/Alert');
const { sendAlertEmail } = require('./emailService');

const checkAlerts = async () => {
  try {
    console.log('🔔 checkAlerts running...');
    const alerts = await Alert.find({ active: true });
    const now = new Date();

    console.log(alerts);

    for (const alert of alerts) {
      const timeframe = new Date(now.getTime() - alert.timeframe * 60000);

      let conditionMet = false;
      let emailText = ''; // yahan email ka custom text store karenge

      console.log('Checking alert:', {
        id: alert._id,
        condition: alert.condition,
        threshold: alert.threshold,
        timeframe: alert.timeframe
      });

      if (alert.condition === 'errorCount') {
        // 👉 Count total errors in timeframe
        const errorCount = await Log.countDocuments({
          userId: alert.userId,
          timestamp: { $gte: timeframe },
          'errorLogs.0': { $exists: true }
        });

        console.log('Error alert stats:', {
          alertId: alert._id,
          errorCount,
          threshold: alert.threshold
        });

        conditionMet = errorCount >= alert.threshold;

        console.log('conditionMet?', { alertId: alert._id, conditionMet });

        if (conditionMet) {
          // 👉 Recent error logs fetch karo (sample ke liye)
          const recentErrorLogs = await Log.find({
            userId: alert.userId,
            timestamp: { $gte: timeframe },
            'errorLogs.0': { $exists: true }
          })
            .sort({ timestamp: -1 })
            .limit(5);

          let errorDetailsText = '';

          recentErrorLogs.forEach(log => {
            (log.errorLogs || []).slice(0, 2).forEach(err => {
              const time = err.timestamp || log.timestamp;
              errorDetailsText +=
                `- ${err.message}\n` +
                `  Page: ${log.pageUrl}\n` +
                `  Source: ${err.source || 'N/A'}\n` +
                `  At: ${time}\n\n`;
            });
          });

          emailText = [
            `Your alert "${alert.name}" was triggered.`,
            '',
            `Condition : ${alert.condition} (error count)`,
            `Threshold : ${alert.threshold}`,
            `Timeframe : last ${alert.timeframe} minutes`,
            '',
            `Total errors in timeframe: ${errorCount}`,
            '',
            'Sample errors:',
            errorDetailsText || 'No detailed error data found.'
          ].join('\n');
        }
      } else {
        // 👉 Performance metric based alert
        const logs = await Log.find({
          userId: alert.userId,
          timestamp: { $gte: timeframe },
          [`performanceMetrics.${alert.condition}`]: { $exists: true }
        });

        const avgValue =
          logs.reduce(
            (sum, log) => sum + log.performanceMetrics[alert.condition],
            0
          ) / (logs.length || 1);

        conditionMet = avgValue >= alert.threshold;

        console.log('Perf alert stats:', {
          alertId: alert._id,
          avgValue,
          threshold: alert.threshold,
          logsCount: logs.length
        });

        if (conditionMet) {
          emailText = [
            `Your alert "${alert.name}" was triggered.`,
            '',
            `Condition : ${alert.condition} (performance metric)`,
            `Threshold : ${alert.threshold}`,
            `Timeframe : last ${alert.timeframe} minutes`,
            '',
            `Average value in timeframe: ${avgValue.toFixed(2)}`
          ].join('\n');
        }
      }

      // Check if we should trigger the alert (avoid spamming)
      const shouldTrigger =
        conditionMet &&
        (!alert.lastTriggered ||
          now - alert.lastTriggered > alert.timeframe * 60000);

      if (shouldTrigger) {
        // Agar custom emailText nahi bana kisi reason se, to fallback:
        const finalText =
          emailText ||
          `Alert condition "${alert.condition}" exceeded threshold of ${alert.threshold} in the last ${alert.timeframe} minutes.`;

        await sendAlertEmail(
          alert.email,
          `Web Monitoring Alert: ${alert.name}`,
          finalText
        );

        alert.lastTriggered = now;
        await alert.save();
      }
    }
  } catch (error) {
    console.error('Error checking alerts:', error);
  }
};

module.exports = { checkAlerts };


// const Log = require('../models/Log');
// const Alert = require('../models/Alert');
// const { sendAlertEmail } = require('./emailService');

// const checkAlerts = async () => {
//   try {

//     console.log('🔔 checkAlerts running...');  // ADD
//     const alerts = await Alert.find({ active: true });
//     const now = new Date();

//     console.log(alerts);
    
    
//     for (const alert of alerts) {
//       const timeframe = new Date(now.getTime() - alert.timeframe * 60000);
      
//       let conditionMet = false;
//       //
//       console.log('Checking alert:', {
//         id: alert._id,
//         condition: alert.condition,
//         threshold: alert.threshold,
//         timeframe: alert.timeframe
//       }); // ADD
//       if (alert.condition === 'errorCount') {
//         const errorCount = await Log.countDocuments({
//           userId: alert.userId,
//           timestamp: { $gte: timeframe },
//           'errorLogs.0': { $exists: true }
//         });
//         console.log('Error alert stats:', {  // ADD
//           alertId: alert._id,
//           errorCount,
//           threshold: alert.threshold
//         });
//         conditionMet = errorCount >= alert.threshold;

//         console.log('conditionMet?', { alertId: alert._id, conditionMet }); // ADD
//       } else {
//         const logs = await Log.find({
//           userId: alert.userId,
//           timestamp: { $gte: timeframe },
//           [`performanceMetrics.${alert.condition}`]: { $exists: true }
//         });
        
//         const avgValue = logs.reduce((sum, log) => 
//           sum + log.performanceMetrics[alert.condition], 0) / (logs.length || 1);
        
//         conditionMet = avgValue >= alert.threshold;
//       }
      
//       // Check if we should trigger the alert (avoid spamming)
//       const shouldTrigger = conditionMet && 
//         (!alert.lastTriggered || 
//          (now - alert.lastTriggered) > alert.timeframe * 60000);
      
//       if (shouldTrigger) {
//         await sendAlertEmail(
//           alert.email,
//           `Web Monitoring Alert: ${alert.name}`,
//           `Alert condition "${alert.condition}" exceeded threshold of ${alert.threshold} in the last ${alert.timeframe} minutes.`
//         );
        
//         alert.lastTriggered = now;
//         await alert.save();
//       }
//     }
//   } catch (error) {
//     console.error('Error checking alerts:', error);
//   }
// };

// module.exports = { checkAlerts };