let app;
module.exports = class WALLET{
    constructor(_app) {
        app = _app;
    }

    // get wallet balance for user by _msg
    async balance(_msg) {
        let user = await app.db.db_user(_msg);
        if (!user) {
            return 0;
        }
        return user.wallet.balance;
    }
}