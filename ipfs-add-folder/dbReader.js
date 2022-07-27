const Sequelize = require('sequelize');
require('dotenv').config();

const userModel = require('./User');
const deviceDetailsModel = require('./DeviceDetail');
const referralHistory = require('./ReferralHistory');
const roleModel = require('./Role');
const signupBonusModel = require('./SignupBonuses');
const accountModel = require('./Account');
const transactionModel = require('./Transaction');
const coinModel = require('./Coin');
const videoCategoryModel = require('./VideoCategory');
const videoModel = require('./Video');
const gameModel = require('./Game');
const watchedVideoModel = require('./watchedVideo');
const countryModel = require('./country');
const kycModel = require('./Kyc');
const bannerModel = require('./Banner');
const taskModel = require('./Task');
const rewardModel = require('./Reward');
const taskTrack = require('./TaskTrack');
const faqModel = require('./Faq');
const notificationModel = require('./Notification');
const videoQuestionModel = require('./VideoQuestions');
const admionNotificationModel = require('./AdminNotification');
const gameTrackModel = require('./GameTrack');
const dailyChallengeLeaderboardModel = require('./DailyChallengeLeaderboard');
const claimModel = require('./Claim');
const hashModel = require('./Hash');
const appAcesssModel = require('./AppAccess');






var sequelize;
if (!sequelize) {
    // sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    //     host: process.env.DB_HOST_READER,
    //     dialect: 'mysql',
    //     logging: false,
    //     port: 3306,
    //     pool: {
    //         acquire: 60000,
    //         idle: 10000
    //     }
    // });

    
}

const DeviceDetail = deviceDetailsModel(sequelize);
const ReferralHistory = referralHistory(sequelize);
const Role = roleModel(sequelize);
const User = userModel(sequelize);
const SignupBonus = signupBonusModel(sequelize);
const Account = accountModel(sequelize);
const Transaction = transactionModel(sequelize);
const Coin = coinModel(sequelize);
const VideoCategory = videoCategoryModel(sequelize);
const Video = videoModel(sequelize);
const Game = gameModel(sequelize);
const WatchedVideo = watchedVideoModel(sequelize);
const Country = countryModel(sequelize);
const Kyc = kycModel(sequelize);
const Banner = bannerModel(sequelize);
const Task = taskModel(sequelize);
const Reward = rewardModel(sequelize);
const TaskTrack = taskTrack(sequelize);
const Faq = faqModel(sequelize);
const Notification = notificationModel(sequelize);
const VideoQuestion = videoQuestionModel(sequelize);
const AdminNotification = admionNotificationModel(sequelize);
const GameTrack = gameTrackModel(sequelize);
const DailyChallengeLeaderboard = dailyChallengeLeaderboardModel(sequelize);
const Claim = claimModel(sequelize);
const Hash = hashModel(sequelize);
const AppAccess = appAcesssModel(sequelize);






sequelize.authenticate().then(async () => {
    /*********************** Relations ***************/
    DeviceDetail.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    User.hasMany(DeviceDetail, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    SignupBonus.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    User.hasOne(SignupBonus, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    User.belongsTo(Role);
    Role.hasMany(User);

    ReferralHistory.belongsTo(User, { foreignKey: 'user1', as: 'referrer', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    User.hasMany(ReferralHistory, { foreignKey: 'user1', as: 'referrer', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    ReferralHistory.belongsTo(User, { foreignKey: 'user2', as: 'referee', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    User.hasOne(ReferralHistory, { foreignKey: 'user2', as: 'referee', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Account.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    User.hasMany(Account, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Transaction.belongsTo(User, { foreignKey: 'sender_id', as: 'senderUser', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    User.hasMany(Transaction, { foreignKey: 'sender_id', as: 'senderUser', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Transaction.belongsTo(Account, { foreignKey: 'sender_acc_id', as: 'senderAccount', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Account.hasMany(Transaction, { foreignKey: 'sender_acc_id', as: 'senderAccount', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Transaction.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiverUser', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    User.hasMany(Transaction, { foreignKey: 'receiver_id', as: 'receiverUser', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Transaction.belongsTo(Account, { foreignKey: 'receiver_acc_id', as: 'receiverAccount', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Account.hasMany(Transaction, { foreignKey: 'receiver_acc_id', as: 'receiverAccount', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Video.belongsTo(VideoCategory, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    VideoCategory.hasMany(Video, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    User.belongsToMany(Video, { through: WatchedVideo, as: 'watcher', foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Video.belongsToMany(User, { through: WatchedVideo, as: 'watched', foreignKey: 'video_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    User.hasOne(Kyc, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Kyc.belongsTo(User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Notification.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });


    Task.belongsToMany(User, { through: TaskTrack, as: 'task', foreignKey: 'task_id' });
    User.belongsToMany(Task, { through: TaskTrack, as: 'user', foreignKey: 'user_id' });

    User.hasMany(TaskTrack, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    TaskTrack.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Task.hasMany(TaskTrack, { foreignKey: 'task_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    TaskTrack.belongsTo(Task, { foreignKey: 'task_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });


    User.hasMany(WatchedVideo, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    WatchedVideo.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Video.hasMany(WatchedVideo, { foreignKey: 'video_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    WatchedVideo.belongsTo(Video, { foreignKey: 'video_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    Video.hasMany(VideoQuestion, { foreignKey: 'video_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    VideoQuestion.belongsTo(Video, { foreignKey: 'video_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });


    User.belongsToMany(Game, { through: GameTrack, as: 'player', foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Game.belongsToMany(User, { through: GameTrack, as: 'game', foreignKey: 'game_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    User.hasMany(GameTrack, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    GameTrack.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Game.hasMany(GameTrack, { foreignKey: 'game_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    GameTrack.belongsTo(Game, { foreignKey: 'game_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

    // await sequelize.sync();
}).catch((error) => {
    console.log("Database connection Error: ", error);
});



module.exports = {
    sequelize,
    Sequelize,
    User,
    DeviceDetail,
    ReferralHistory,
    Role,
    SignupBonus,
    Account,
    Transaction,
    Coin,
    Video,
    VideoCategory,
    Game,
    WatchedVideo,
    Country,
    Kyc,
    Banner,
    Task,
    Reward,
    TaskTrack,
    Faq,
    Notification,
    VideoQuestion,
    AdminNotification,
    GameTrack,
    DailyChallengeLeaderboard,
    Claim,
    Hash,
    AppAccess
}