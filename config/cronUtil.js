const cron = require("node-cron");
const Subscription = require("../models/subscription.model");

async function expiryDateCronSchedule() {
  cron.schedule("0 0 * * *", async () => {
    try {
      //   let today = "2025-07-11T08:00:00.000Z";
      const currentDate = new Date();
      const result = await Subscription.updateMany(
        {
          expiryDate: { $lt: currentDate },
          subscriptionStatus: { $ne: "Expired" },
        },
        { $set: { subscriptionStatus: "Expired" } }
      );
      console.log(`${result.modifiedCount} subscriptions updated to 'Expired'`);
    } catch (error) {
      console.error("Error updating subscriptions:", error);
    }
  });
}

module.exports = {
  expiryDateCronSchedule,
};
