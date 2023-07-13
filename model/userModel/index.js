const db = require('../../store');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { resolve } = require('path');
const { send } = require('process');
const nodeGeocoder = require('node-geocoder');
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN);

function hashPass(pass) {
    var hash = crypto.createHash('sha256');
    return hash.update(pass).digest('hex');
}

const getPersonId = async (token) => {
    try {
        const query = `
            SELECT p.id FROM user u, person p WHERE u.token = ${token} and u.phone = p.phone; 
        `;
        return new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log(result);
                    resolve(result[0]?.id);
                }
            });
        });
    } catch (e) {
        throw e;
    }
};

const getUserList = (req, res) => {
    const sql = 'SELECT phone FROM user';
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

const getUser = (token, device_id, res) => {
    const getUserData = () => {
        db.query(`SELECT * FROM person p, user u WHERE p.phone = u.phone AND u.token=${token}`, (err, result) => {
            if (err) {
                res.send({
                    statusCode: 400,
                    responseData: err.toString(),
                });
            } else {
                const person_info = result;
                new Promise((resolve, reject) => {
                    db.query(`SELECT * FROM profile_img WHERE person_id=${person_info[0]?.id}`, (err, result) => {
                        if (err) {
                            res.send({
                                statusCode: 400,
                                responseData: err.toString(),
                            });
                        } else {
                            resolve(result);
                        }
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                }).then((image) => {
                    person_info[0].img = image;
                    res.send({
                        statusCode: 200,
                        responseData: person_info,
                    });
                });
            }
        });
    };

    const checkUserInDevice = () => {
        db.query(
            `SELECT * FROM user u, user_in_device ud WHERE u.phone = ud.phone AND device_id = '${device_id}' AND is_using = 1`,
            (err, result) => {
                if (err) {
                    res.send({
                        statusCode: 400,
                        responseData: err.toString(),
                    });
                } else {
                    if (result.length > 0) {
                        getUserData();
                    } else {
                        res.send({
                            statusCode: 404,
                            responseData: 'User Not Found In Device',
                        });
                    }
                }
            },
        );
    };

    checkUserInDevice();
};

const postUser = (req, res) => {
    const { phone, pass, name, birthday, photo, photo1, gender, obgender, interests } = req.body;
    const password = hashPass(pass.toString());

    const insertMyBasics = (person_id) => {
        db.query(`INSERT INTO my_basics (person_id) VALUES (${person_id})`, (err, result) => {
            if (err) {
                res.status(403).json('Failed to insert your basics data');
            } else {
                res.status(200).json('Sign Up Successfully');
            }
        });
    };

    const insertInterests = (person_id) => {
        interests.forEach((interestId) => {
            const sql = `INSERT INTO my_interest (person_id, interest_id) VALUES (${person_id}, ${interestId})`;
            db.query(sql, (err, result) => {
                if (err) {
                    res.status(403).json('Failed to insert your interests data');
                    console.error('Error saving interest:', err);
                } else {
                    console.log('Interest saved successfully!');
                }
            });
        });
        insertMyBasics();
    };

    const insertImageData = (person_id) => {
        db.query(
            `INSERT INTO profile_img (image, person_id) VALUES ('${photo}', ${person_id}), ('${photo1}',${person_id});`,
            (err, result) => {
                if (err) {
                    res.status(500).json(err.toString());
                } else {
                    if (result.affectedRows > 0) {
                        insertInterests(person_id);
                    }
                }
            },
        );
    };

    const insertPersonData = () => {
        const date = new Date(Date.parse(birthday));
        const convertedDate = `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getDate()}`;
        db.query(
            `INSERT INTO person (full_name, dob, phone, sex, sex_oriented, relationship_oriented_id, about_me, address, age_oriented, distance, active_status) VALUES ('${name}', '${convertedDate}', '${phone}', ${gender}, ${obgender}, 1, 'Trống', 'Trống', 0, 0, 1)`,
            (err, result) => {
                if (err) {
                    res.status(500).json(err.toString());
                } else {
                    if (result.affectedRows > 0) {
                        const person_id = result.insertId;
                        insertImageData(person_id);
                    }
                }
            },
        );
    };

    const insertUserData = () => {
        const sql = 'INSERT INTO user (phone, pass) VALUES';
        db.query(`${sql} ('${phone}', '${password}')`, (err, result) => {
            if (err) {
                res.status(500).json(err.toString());
            } else {
                if (result.affectedRows > 0) {
                    insertPersonData();
                }
            }
        });
    };

    insertUserData();
};

const signoutUser = (phone, device_id, res) => {
    const updateUserInDeviceData = () => {
        db.query(`UPDATE user_in_device SET is_using = 0 WHERE device_id = '${device_id}'`, (err, result) => {
            if (err) {
                res.send({
                    statusCode: 400,
                    responseData: err.toString(),
                });
            } else {
                if (result.affectedRows > 0) {
                    res.send({
                        statusCode: 200,
                        responseData: 'Sign out successfully',
                    });
                }
            }
        });
    };

    db.query(`UPDATE user SET token='' WHERE phone='${phone}'`, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            if (result.affectedRows > 0) {
                updateUserInDeviceData();
            }
        }
    });
};

const checkPhone = (phonenumber, res) => {
    db.query(`SELECT * FROM user WHERE phone = '${phonenumber}'`, (error, results) => {
        if (error) {
            res.status(500).json({ error });
        } else {
            if (results.length !== 0) {
                res.status(404).json({ error: 'Phone number has been registered' });
            } else {
                console.log('phone number: ', phonenumber);
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
    const { phone, pass, device_id } = req.body;

    const createNewUserInDeviceData = (token) => {
        console.log('create');
        db.query(
            `INSERT INTO user_in_device (phone, device_id, is_using) VALUES ('${phone}', '${device_id}', 1)`,
            (err, result) => {
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
            },
        );
    };

    const updateUserInDeviceData = (token) => {
        console.log('update');
        db.query(
            `UPDATE user_in_device SET is_using = 1 WHERE phone = '${phone}' AND device_id = '${device_id}'`,
            (err, result) => {
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
            },
        );
    };

    const checkUserInDevice = (token) => {
        db.query(
            `SELECT * FROM user_in_device WHERE device_id = '${device_id}' AND phone = '${phone}'`,
            (err, result) => {
                if (err) {
                    res.send({
                        statusCode: 400,
                        responseData: err,
                    });
                } else {
                    if (result.length > 0) {
                        updateUserInDeviceData(token);
                    } else {
                        createNewUserInDeviceData(token);
                    }
                }
            },
        );
    };

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
                        checkUserInDevice(token);
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

const getAvatarOfUser = (user_id, res) => {
    db.query(`SELECT * FROM profile_img WHERE person_id=${user_id}`, (err, result) => {
        {
            if (err) {
                res.send({
                    statusCode: 400,
                    responseData: err.toString(),
                });
            } else {
                res.send({
                    statusCode: 200,
                    responseData: result[0]?.image || '',
                });
            }
        }
    });
};

const postImageIntoProfile = (photo, person_id, res) => {
    db.query(`INSERT INTO profile_img (image, person_id) VALUE ('${photo.image}', ${person_id})`, (err, result) => {
        if (err) {
            console.log(err);
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

const getProfile = (req, res) => {
    const { personId } = req.params;
    const query = `select p.id as 'person_id', ro.id as 'relationship_oriented_id', mb.id as 'my_basics_id', full_name, dob, phone, address, about_me, sex, sex_oriented, ro.name as 'relationship_oriented', zodiac, education, social_network, physical, pet, music, mb.language
                from person p, relationship_oriented ro, my_basics mb
                where p.id = mb.person_id and ro.id = p.relationship_oriented_id and p.id = ?`;
    db.query(query, [personId], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
};

const updateMyBasic = (req, res) => {
    const { myBasicId } = req.params;
    const { zodiac, education, language, socialNetwork, physicalExercise, pet, music } = req.body;
    const query = `UPDATE my_basics SET zodiac = ?, education = ?, language = ?, social_network = ?, physical = ?, pet = ?, music = ? WHERE id = ?`;
    db.query(
        query,
        [zodiac, education, language, socialNetwork, physicalExercise, pet, music, myBasicId],
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Internal server error');
            } else {
                console.log(result);
                res.status(200).send('My basic was updated successfully');
            }
        },
    );
};

const getInterestList = (req, res) => {
    const query = `select * from interest `;
    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};
///// Lỗi db my interest
const getMyInterest = (req, res) => {
    const { personId } = req.params;
    const query = `SELECT  mi.interest_id as 'id',name
    FROM interest i, my_interest mi, person p
    where i.id=mi.interest_id and p.id = mi.person_id and p.id = ? `;
    db.query(query, [personId], (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};

const postMyInterest = (req, res) => {
    const { personid } = req.params;
    const data = req.params.data.split(',');

    const deleteQuery = `DELETE FROM my_interest WHERE person_id = ?`;
    db.query(deleteQuery, [personid], (err, deleteResult) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
        const insertQuery = `INSERT INTO my_interest (person_id, interest_id) VALUES (?, ?)`;
        const insertPromises = data.map((item) => {
            return new Promise((resolve, reject) => {
                db.query(insertQuery, [personid, item], (err, insertResult) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(insertResult);
                    }
                });
            });
        });
        Promise.all(insertPromises)
            .then((results) => {
                res.send(results);
            })
            .catch((error) => {
                console.log(error);
                res.sendStatus(500);
            });
    });
};
const getRelationshipOrientedList = (req, res) => {
    const query = ` select * from relationship_oriented`;
    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};
const setProfile = (req, res) => {
    const { personId } = req.params;
    const { age_oriented, distance, active_status } = req.body;
    const query = 'UPDATE person SET age_oriented=?, distance=?, active_status=? WHERE id =?';
    db.query(query, [age_oriented, distance, active_status, personId], (error, results) => {
        if (error) {
            res.status(500).json({ error });
            console.log(error);
        } else {
            res.json({ message: 'profile update successfully' });
            console.log(results);
        }
    });
};

const checkCurrentPassword = (pass, phone) => {
    const hashedPass = hashPass(pass);
    try {
        return new Promise((resolve, reject) => {
            db.query(`SELECT * FROM user WHERE pass='${hashedPass}' AND phone='${phone}'`, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    if (result.length === 0) {
                        resolve({
                            statusCode: 400,
                            responseData: 'Current password is incorrect',
                        });
                    } else {
                        resolve({
                            statusCode: 200,
                            responseData: 'Current password is correct',
                        });
                    }
                }
            });
        });
    } catch (err) {
        console.log(err);
    }
};

const putNewPassword = (new_pass, phone, res) => {
    db.query(`UPDATE user SET pass='${hashPass(new_pass)}' WHERE phone='${phone}'`, (err, result) => {
        if (err) {
            res.send({
                statusCode: 400,
                responseData: err.toString(),
            });
        } else {
            if (result.affectedRows > 0) {
                res.send({
                    statusCode: 200,
                    responseData: 'Update new password successfully',
                });
            }
        }
    });
};

const putProfile = (req, res) => {
    const { personId } = req.params;
    const { about, address, sex, sexOriented, relationshipOrientedId } = req.body;
    const query =
        'UPDATE person SET about_me=?, address=?, sex=?, sex_oriented=?, relationship_oriented_id=? WHERE id =?';
    db.query(query, [about, address, sex, sexOriented, relationshipOrientedId, personId], (error, results) => {
        if (error) {
            res.status(500).json({ error });
            console.log(error);
        } else {
            res.json({ message: 'Update profile successfully' });
            console.log(results);
        }
    });
};

const getTopLike = (req, res) => {
    const query = `SELECT p.id AS target_id,p.full_name,image,
    COUNT(l.target_id) AS numOfLike
    FROM Honeyaa.like l JOIN person p ON l.target_id = p.id
    JOIN (SELECT MIN(pi.id) AS min_image_id,pi.person_id
    FROM profile_img pi
    GROUP BY pi.person_id
    ) min_pi ON min_pi.person_id = p.id
    JOIN profile_img pi ON pi.id = min_pi.min_image_id
    GROUP BY target_id,full_name,image
    ORDER BY numOfLike DESC
    LIMIT 10;`;
    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};

const getSent = (req, res) => {
    const { personId } = req.params;
    const query = `SELECT l.id as likeId, p.id AS target_id, p.full_name, image, create_at, l.is_responsed
    FROM Honeyaa.like l JOIN person p ON l.target_id = p.id
    JOIN (SELECT MIN(pi.id) AS min_image_id, pi.person_id
    FROM profile_img pi
    GROUP BY pi.person_id
    ) min_pi ON min_pi.person_id = p.id
    JOIN profile_img pi ON pi.id = min_pi.min_image_id
    where l.person_id=?
    GROUP BY target_id,full_name,image, create_at, likeId
    ORDER BY create_at desc;`;
    db.query(query, [personId], (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};
const deleteSent = (req, res) => {
    const { likeId } = req.params;
    const query = `DELETE FROM Honeyaa.like WHERE id =?;`;
    db.query(query, [likeId], (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};
const getXlike = (req, res) => {
    const { personId } = req.params;
    const query = `SELECT l.id as likeId,p.id AS person_id,p.full_name,image, create_at
    FROM Honeyaa.like l JOIN person p ON l.person_id = p.id
    JOIN (SELECT MIN(pi.id) AS min_image_id,pi.person_id
    FROM profile_img pi
    GROUP BY pi.person_id
    ) min_pi ON min_pi.person_id = p.id
    JOIN profile_img pi ON pi.id = min_pi.min_image_id
    where l.target_id=? and l.is_matched = 0 and l.is_responsed = 0 
    GROUP BY person_id,full_name,image, create_at,likeId
    ORDER BY create_at desc;`;
    db.query(query, [personId, personId], (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};

const getChat = (req, res) => {
    const { personId, targetId } = req.params;
    const query = `SELECT dc.id AS chat_id, dc.content, dc.sent_time ,dc.person_id AS sender_id, p.full_name AS sender_name
                    FROM chat c
                    JOIN detail_chat dc ON c.id = dc.chat_id
                    JOIN person p ON dc.person_id = p.id
                    WHERE (c.person_id =? AND c.target_id =?) OR (c.person_id =? AND c.target_id =?)
                    ORDER BY dc.sent_time desc
                    LIMIT 20;`;
    db.query(query, [personId, targetId, targetId, personId], (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};
const postMessage = (req, res) => {
    const { chatId, personId, content, sentTime } = req.body;
    const query = 'INSERT INTO detail_chat (chat_id, person_id, content, sent_time) VALUE (?, ?, ?, ?)';
    db.query(query, [chatId, personId, content, sentTime], (err, result) => {
        if (err) {
            console.log(err);
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

const getUserInfoByToken = (token) => {
    try {
        return new Promise((resolve, reject) => {
            db.query(`SELECT * FROM person p, user u WHERE p.phone = u.phone AND u.token='${token}'`, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
};

const potentialLover = async (id, sex_oriented, age_oriented) => {
    const currentYearsOld = (date) => {
        const currentDate = new Date();
        const dob = new Date(Date.parse(date));
        const yearsOld = Number.parseInt(currentDate.getUTCFullYear()) - Number.parseInt(dob.getUTCFullYear());
        const currentMonth = currentDate.getMonth();
        const monthInDOB = dob.getMonth();
        if (currentMonth < monthInDOB) {
            return yearsOld - 1;
        }
        return yearsOld;
    };

    try {
        return new Promise((resolve, reject) => {
            db.query(
                `
        SELECT p.id, p.full_name, p.dob, p.phone, p.sex, p.sex_oriented, p.relationship_oriented_id, p.about_me, p.address 
        FROM person p
        WHERE
            p.id != ${id} AND
            p.sex = ${sex_oriented} AND
            -- p.active_status = 1 AND
            NOT EXISTS (
                SELECT * FROM honeyaa.like l
                WHERE (l.target_id = p.id AND l.person_id = ${id}) 
                OR (l.target_id = ${id} AND l.person_id = p.id AND l.is_matched = 1) 
                OR (l.target_id = ${id} AND l.person_id = p.id AND l.is_matched = 0  AND l.is_responsed = 1)
        )`,
                (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        const finalResult = result.filter(async (item) => currentYearsOld(item.dob) <= age_oriented);
                        resolve(finalResult);
                    }
                },
            );
        });
    } catch (error) {
        console.log(error);
    }
};

const getImageByUserId = async (person_id) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.query(`SELECT * FROM profile_img WHERE person_id=${person_id}`, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        return await result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const getMyInterestByUserId = async (userId) => {
    try {
        return new Promise((resolve, reject) => {
            const query = `SELECT  mi.interest_id as 'id',name
            FROM interest i, my_interest mi, person p
            where i.id=mi.interest_id and p.id = mi.person_id and p.id = ? `;
            db.query(query, [userId], (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
};

const getBasicsByUserId = async (userId) => {
    try {
        return new Promise((resolve, reject) => {
            db.query(`SELECT * FROM my_basics WHERE person_id=${userId}`, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (err) {}
};

const getRelationshipOrientedByUserId = async (userId) => {
    try {
        return new Promise((resolve, reject) => {
            db.query(
                `
                SELECT ro.name, ro.id
                FROM relationship_oriented ro, person ps   
                where ps.relationship_oriented_id = ro.id and ps.id = ${userId}
            `,
                (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                },
            );
        });
    } catch (error) {
        console.log(error);
    }
};

const getQuestions = async (id) => {
    try {
        const query = `
            SELECT * FROM question_content q
            WHERE q.topic_id = ${id} 
        `;
        return new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (e) {
        throw e;
    }
};

const getAnswers = async (ids) => {
    try {
        const query = `
            SELECT * FROM question_answer a
            WHERE a.question_id IN (${ids}); 
        `;
        return new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (e) {
        throw e;
    }
};

const saveAnswers = async (answers, personId) => {
    try {
        const query = `
            INSERT INTO person_answer (answer_id, person_id) VALUES ?
        `;

        const values = answers.filter((answer) => answer !== null).map((answer) => [answer, personId]);

        return new Promise((resolve, reject) => {
            db.query(query, [values], (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (e) {
        throw e;
    }
};

const getUserDiscover = async (id, sex_oriented, age_oriented) => {
    const currentYearsOld = (date) => {
        const currentDate = new Date();
        const dob = new Date(Date.parse(date));
        const yearsOld = Number.parseInt(currentDate.getUTCFullYear()) - Number.parseInt(dob.getUTCFullYear());
        const currentMonth = currentDate.getMonth();
        const monthInDOB = dob.getMonth();
        if (currentMonth < monthInDOB) {
            return yearsOld - 1;
        }
        return yearsOld;
    };

    try {
        return new Promise((resolve, reject) => {
            db.query(
                `
                SELECT p.id, p.full_name, p.dob, p.phone, p.sex, p.sex_oriented, p.relationship_oriented_id, p.about_me, p.address ,
                    COUNT(DISTINCT pa.answer_id) AS matching_answers
                FROM person p
                JOIN person_answer pa ON p.id = pa.person_id
                WHERE
                    p.id != ${id} AND
                    p.sex = ${sex_oriented} AND
                    -- p.active_status = 1 AND
                    NOT EXISTS (
                        SELECT * FROM honeyaa.like l
                        WHERE (l.target_id = p.id AND l.person_id = ${id}) 
                            OR (l.target_id = ${id} AND l.person_id = p.id AND l.is_matched = 1) 
                            OR (l.target_id = ${id} AND l.person_id = p.id AND l.is_matched = 0  AND l.is_responsed = 1)
                    )
                    AND pa.answer_id IN (
                        SELECT answer_id FROM person_answer WHERE person_id = ${id}
                    )
                GROUP BY p.id
                ORDER BY matching_answers DESC;
            `,
                (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        console.log(result);
                        const finalResult = result.filter(async (item) => currentYearsOld(item.dob) <= age_oriented);
                        resolve(finalResult);
                    }
                },
            );
        });
    } catch (error) {
        console.log(error);
    }
};

const checkTopicAnswers = async (personId, topicId) => {
    try {
        const query = `
            SELECT * FROM person_answer pa, question_answer qa, question_content q 
            WHERE pa.person_id = ${personId} and pa.answer_id = qa.id and qa.question_id = q.id and q.topic_id = ${topicId};
        `;

        return new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result?.[0]);
                }
            });
        });
    } catch (e) {
        throw e;
    }
};

const getMatchChat = (req, res) => {
    const { personId } = req.params;
    const query = `SELECT p.id AS target_id, p.full_name, pi.image AS image, c.id AS chat_id, dt.content
    FROM person p
    JOIN (SELECT MIN(pi.id) AS min_image_id,pi.person_id
    FROM profile_img pi
    GROUP BY pi.person_id
    ) min_pi ON min_pi.person_id = p.id
    JOIN profile_img pi ON pi.id = min_pi.min_image_id
    RIGHT JOIN chat c ON c.person_id = p.id OR c.target_id = p.id
    LEFT JOIN (
    SELECT p.id, p.full_name, GROUP_CONCAT(DISTINCT pi.image SEPARATOR ',') AS image, c1.content, c1.id as chat_id
    FROM person p
    LEFT JOIN profile_img pi ON pi.person_id = p.id
    RIGHT JOIN chat c ON c.person_id = p.id OR c.target_id = p.id
    LEFT JOIN (
    SELECT c.id, dc.id AS chat_id, dc.content, dc.sent_time, dc.person_id AS sender_id, p.full_name AS sender_name
    FROM chat c
    JOIN detail_chat dc ON c.id = dc.chat_id
    JOIN person p ON dc.person_id = p.id
    WHERE dc.sent_time = (
    SELECT MAX(sent_time)
    FROM detail_chat
    WHERE chat_id = c.id
    )
    ORDER BY dc.sent_time desc
    ) c1 ON c1.sender_id = p.id
    GROUP BY p.id, p.full_name, c1.content, c1.id
    ) dt on dt.chat_id = c.id
    where p.id<>? and (c.person_id=? or c.target_id=?)
    GROUP BY p.id, p.full_name, c.id,dt.content, pi.image;`;
    db.query(query, [personId, personId, personId], (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
    });
};

const getNotification = (person_id, res) => {
    db.query(
        `
            SELECT p.full_name, pi.image, l.create_at 
            FROM honeyaa.like l, person p, profile_img pi 
            WHERE l.person_id=${person_id} AND l.is_matched=1 AND l.is_responsed=1 AND l.target_id=p.id AND p.id=pi.person_id
            LIMIT 1
        `,
        (err, result) => {
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
        },
    );
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
    getAvatarOfUser,
    postImageIntoProfile,
    removeImageFromProfile,
    getProfile,
    getInterestList,
    getMyInterest,
    postMyInterest,
    getRelationshipOrientedList,
    setProfile,
    checkCurrentPassword,
    putNewPassword,
    putProfile,
    updateMyBasic,
    getTopLike,
    getChat,
    postMessage,
    getMatchChat,
    getUserInfoByToken,
    potentialLover,
    getImageByUserId,
    getMyInterestByUserId,
    getBasicsByUserId,
    getRelationshipOrientedByUserId,
    getSent,
    getXlike,
    getQuestions,
    deleteSent,
    getAnswers,
    getPersonId,
    saveAnswers,
    getUserDiscover,
    checkTopicAnswers,
    getNotification,
};
