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
                    is_matched: false,
                });
                break;
            case DISLIKE:
                res.send({
                    statusCode: 200,
                    responseData: 'Disliked',
                    is_matched: false,
                });
                break;
            case SUPER_LIKE:
                res.send({
                    statusCode: 200,
                    responseData: 'Super Liked',
                    is_matched: false,
                });
                break;
            default:
                break;
        }
    };

    const createNewLikeDataRow = () => {
        db.query(
            'INSERT INTO `like` ' +
                `(person_id, target_id, type_id, create_at, is_matched, is_responsed) VALUES (${person_id}, ${target_id}, ${type}, '${currentDate}', 0, 0)`,
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

    const createChatPlace = () => {
        db.query(`INSERT INTO chat (person_id, target_id) VALUES (${target_id}, ${person_id})`, (err, result) => {
            if (err) {
                res.send({
                    statusCode: 400,
                    responseData: err.toString(),
                });
            } else {
                if (result.affectedRows > 0) {
                    res.send({
                        statusCode: 200,
                        responseData: {
                            message: 'Match successfully',
                        },
                        is_matched: true,
                    });
                }
            }
        });
    };

    const updateMatched = () => {
        const LIKE = 1;
        const SUPER_LIKE = 3;
        if (type === LIKE || type === SUPER_LIKE) {
            db.query(
                'UPDATE `like` ' +
                    `SET is_matched = 1, is_responsed = 1 WHERE target_id=${person_id} AND person_id=${target_id}`,
                (err, result) => {
                    if (err) {
                        res.send({
                            statusCode: 400,
                            responseData: err.toString(),
                        });
                    } else {
                        if (result.affectedRows > 0) {
                            createChatPlace();
                        }
                    }
                },
            );
        } else {
            db.query(
                'UPDATE `like` ' + `SET is_responsed = 1 WHERE target_id=${person_id} AND person_id=${target_id}`,
                (err, result) => {
                    if (err) {
                        res.send({
                            statusCode: 400,
                            responseData: err.toString(),
                        });
                    } else {
                        if (result.affectedRows > 0) {
                            sendResponse();
                        }
                    }
                },
            );
        }
    };

    const checkProfileLikedMe = () => {
        db.query('SELECT * FROM `like`' + `WHERE target_id=${person_id} AND person_id=${target_id}`, (err, result) => {
            if (err) {
                res.send({
                    statusCode: 400,
                    responseData: err.toString(),
                });
            } else {
                const LIKE = 1;
                const SUPER_LIKE = 3;
                const isExistedLikeDataOfTwoUser = result.length > 0;
                if (isExistedLikeDataOfTwoUser) {
                    const like_type = result[0].type_id;
                    if (like_type === LIKE || like_type === SUPER_LIKE) {
                        updateMatched();
                    }
                } else {
                    createNewLikeDataRow();
                }
            }
        });
    };

    checkProfileLikedMe();
};

module.exports = {
    postInteract,
};
