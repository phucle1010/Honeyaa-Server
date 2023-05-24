const db = require('../../store');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN);

function hashPass(pass) {
    var hash = crypto.createHash('sha256');
    return hash.update(pass).digest('hex');
}

const getUserList = (req, res) => {
    const sql = 'SELECT * FROM user';
    db.query(sql, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            res.send({
                statusCode: 200,
                responseData: result,
            });
        }
    });
};

const getUser = (token, res) => {
    db.query(`SELECT * FROM person p, user u WHERE p.phone = u.phone AND u.token=${token}`, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            res.send({
                statusCode: 200,
                responseData: result,
            });
        }
    });
};

const postUser = (req, res) => {
    const { phone, pass, name, birthday, photo, photo1, gender, obgender, interests } = req.body;
    const password = hashPass(pass.toString());

    const insertInterests = () => {
        db.query(`INSERT INTO interest (person_id) VALUES ('${person_id}')`, (err, result) => {
            if (err) {
                res.status(500).json({ err });
            } else {
                const interest_id = result.insertId;
                for (let i = 0; i < interests.length; i++) {
                    db.query(
                        `INSERT INTO detail_interest (name, interest_id) VALUES ('${interests[i]}','${interest_id}')`,
                        (err, sesult) => {
                            if (err) {
                                res.status(500).json({ err });
                            } else {
                                console.log(result);
                                res.send(result);
                            }
                        },
                    );
                }
            }
        });
    };

    const insertImageData = (person_id) => {
        db.query(
            `INSERT INTO profile_img (image, person_id) VALUES ('${photo}','${person_id}'), ('${photo1}','${person_id}');`,
            (err, result) => {
                if (err) {
                    res.status(500).json({ err });
                } else {
                    insertInterests();
                }
            },
        );
    };

    const insertPersonData = () => {
        db.query(
            `INSERT INTO person (full_name, dob, phone, sex, sex_oriented) VALUES ('${name}', '${birthday}', '${phone}', '${gender}', '${obgender}')`,
            (err, result) => {
                if (err) {
                    res.status(500).json({ err });
                } else {
                    const person_id = result.insertId;
                    insertImageData(person_id);
                }
            },
        );
    };

    const insertUserData = () => {
        db.query(`INSERT INTO user (phone, pass) VALUES ('${phone}', "${password}")`, (err, result) => {
            if (err) {
                res.status(500).json({ err });
            } else {
                insertPersonData();
            }
        });
    };

    insertUserData();
};

const signoutUser = (token, res) => {
    db.query(`UPDATE user SET token='${token}'`, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            res.send({
                statusCode: 200,
                responseData: 'Sign out successfully',
            });
        }
    });
};

const checkPhone = (phonenumber, res) => {
    db.query('SELECT * FROM user WHERE phone = ?', [phonenumber], (error, results) => {
        if (error) {
            res.status(500).json({ error });
        } else if (results.length !== 0) {
            res.status(404).json({ error: 'Phone number has sign up' });
        } else {
            client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verifications.create({
                    to: `+84${phonenumber}`,
                    channel: 'sms',
                })
                .then((data) => {
                    res.status(200).send({
                        message: 'Verification is sent!!',
                        phonenumber,
                        data,
                    });
                });
        }
    });
};

const verifyAuthen = (activate, phone, res) => {
    // const sql = 'UPDATE user SET activated = ? WHERE phone = ?';
    // db.query(sql, [activate, phone], (error, results) => {
    //     if (error) {
    //         res.status(500).json({ error });
    //     } else if (results.affectedRows === 0) {
    //         res.status(404).json({ error: 'User not found' });
    //     } else {
    //         res.json({ message: 'Account activated successfully' });
    //     }
    // });
};

const verifyPhone = (phonenumber, res) => {
    db.query(`SELECT * FROM user WHERE phone = '${phonenumber}'`, (error, results) => {
        if (error) {
            res.status(500).json({ error });
        } else if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verifications.create({
                    to: `+84${req.query.phonenumber}`,
                    channel: 'sms',
                })
                .then((data) => {
                    res.status(200).send({
                        message: 'Verification is sent!!',
                        phonenumber: req.query.phonenumber,
                        data,
                    });
                });
        }
    });
};

const verifyOTP = (phonenumber, code, res) => {
    client.verify.v2
        .services(process.env.TWILIO_SERVICE_SID)
        .verificationChecks.create({
            to: `+84${phonenumber}`,
            code: code,
        })
        .then((data) => {
            if (data.status === 'approved') {
                res.status(200).send({
                    message: 'User is Verified!!',
                    data,
                });
            }
        });
};

const loginUser = (req, res) => {
    const { phone, pass } = req.body;
    db.query(`SELECT * FROM user WHERE phone = '${phone}' AND pass = '${hashPass(pass)}'`, (error, results) => {
        if (error) {
            res.send({ statusCode: 400, responseData: error });
        } else if (results.length === 0) {
            res.send({ statusCode: 400, responseData: 'Please check your info again' });
        } else {
            const user = results[0];
            const token = jwt.sign({ id: user.id, username: user.phone }, 'secret_key');
            db.query(`UPDATE user SET token = '${token}' WHERE phone = '${phone}'`, (err, result) => {
                if (err) {
                    res.send({
                        statusCode: 400,
                        responseData: err,
                    });
                } else {
                    if (result.affectedRows > 0) {
                        res.send({
                            statusCode: 200,
                            responseData: token,
                        });
                    }
                }
            });
        }
    });
};

const getImageOfUser = (person_id, res) => {
    const createFullImageList = (images) => {
        const emptyImage = {
            id: null,
            image: '',
            person_id: null,
        };

        if (images.length < 6) {
            let newImages = [...images];
            for (let i = images.length; i < 6; i++) {
                newImages = [...newImages, emptyImage];
            }
            return newImages;
        }
        return images;
    };

    db.query(`SELECT * FROM profile_img WHERE person_id=${person_id}`, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            const images = createFullImageList(result);
            res.send({
                statusCode: 200,
                responseData: images,
            });
        }
    });
};

const postImageIntoProfile = (photo, person_id, res) => {
    db.query(`INSERT INTO profile_img (image, person_id) VALUE ('${photo.image}', ${person_id})`, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            res.send({
                statusCode: 200,
                responseData: 'Success',
            });
        }
    });
};

const removeImageFromProfile = (photo_id, person_id, res) => {
    db.query(`DELETE FROM profile_img WHERE id=${photo_id} AND person_id=${person_id}`, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            if (result.affectedRows > 0) {
                res.send({
                    statusCode: 200,
                    responseData: 'Remove photo successfully',
                });
            }
        }
    });
};

module.exports = {
    getUserList,
    getUser,
    postUser,
    signoutUser,
    checkPhone,
    verifyAuthen,
    verifyPhone,
    verifyOTP,
    loginUser,
    getImageOfUser,
    postImageIntoProfile,
    removeImageFromProfile,
};
