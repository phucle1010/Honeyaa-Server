const db = require('../../store');

const postInteract = (person_id, target_id, type, res) => {
    const LIKE = 1;
    const DISLIKE = 2;
    const SUPER_LIKE = 3;

    const date = new Date();
    const currentDate = `${date.getUTCFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    const sendResponse = () => {
        switch (type) {
            case LIKE:
                res.send({
                    statusCode: 200,
                    responseData: 'Liked',
                });
                break;
            case DISLIKE:
                res.send({
                    statusCode: 200,
                    responseData: 'Disliked',
                });
                break;
            case SUPER_LIKE:
                res.send({
                    statusCode: 200,
                    responseData: 'Super Liked',
                });
                break;
            default:
                break;
        }
    };

    db.query(
        'INSERT INTO `like` (person_id, target_id, type_id, create_at, is_matched) VALUES (?, ?, ?, ?, ?)',
        [person_id, target_id, type, currentDate, 0],
        (err, result) => {
            if (err) {
                res.send({
                    statusCode: 400,
                    responseData: err.toString(),
                });
            } else {
                if (result.affectedRows > 0) {
                    {
                        sendResponse();
                    }
                }
            }
        },
    );
};

module.exports = {
    postInteract,
};
