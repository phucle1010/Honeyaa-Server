const db = require('../../store');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { send } = require('process');
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN);

function hashPass(pass) {
    var hash = crypto.createHash('sha256');
    return hash.update(pass).digest('hex');
}

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

const getRecommendationUserDataList = (requestedUserId, res) => {
    db.query(
        `SELECT p.id, p.full_name, p.dob, p.phone, p.sex, p.sex_oriented, p.relationship_oriented_id FROM person p WHERE p.id != ${requestedUserId}`,
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
    // const [image, image1] = req.files;
    // const photo = image.buffer;
    // const photo1 = image1.buffer;
    // console.log(req.body);
    const { phone, pass, name, birthday, gender, obgender, interests, photo, photo1 } = req.body;
    const password = hashPass(pass.toString());

    const insertInterests = (person_id) => {
        interests.forEach((interestId) => {
            const sql = `INSERT INTO my_interest (person_id, interest_id) VALUES (${person_id}, ${interestId})`;
            db.query(sql, (err, result) => {
                if (err) {
                    console.error('Error saving interest:', err);
                } else {
                    console.log('Interest saved successfully!');
                }
            });
        });
        return res.status(200).json('Đăng ký thành công');
    };

    const insertImageData = (person_id) => {
        db.query(
            `INSERT INTO profile_img (image, person_id) VALUES ('${photo}',${person_id}), ('${photo1}',${person_id});`,
            (err, result) => {
                if (err) {
                    res.status(500).json({ err });
                } else {
                    insertInterests(person_id);
                }
            },
        );
    };

    const insertPersonData = () => {
        const date = new Date(Date.parse(birthday));
        const convertedDate = `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getDate()}`;
        db.query(
            `INSERT INTO person (full_name, dob, phone, sex, sex_oriented, about_me, address) VALUES ('${name}', '${convertedDate}', '${phone}', ${gender}, ${obgender}, 'Trống', 'Trống')`,
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
        db.query(`INSERT INTO user (phone, pass) VALUES ('${phone}', '${password}')`, (err, result) => {
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
    db.query('SELECT * FROM user WHERE phone = ?', [phonenumber.phonenumber], (error, results) => {
        if (error) {
            console.log('error: ', error);
            res.status(500).json({ error });
        } else if (results.length !== 0) {
            res.status(404).json({ error: 'Phone number has sign up' });
        } else {
            client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verifications.create({
                    to: `+84${phonenumber.phonenumber}`,
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
    console.log(phonenumber, code);
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
///// Lỗi db ở đây
const getProfile = (req, res) => {
    const { personId } = req.params;
    const query = `select p.id as 'person_id', ro.id as 'relationship_oriented_id', mb.id as 'my_basics_id', full_name, dob, phone, address, about_me, sex, sex_oriented, ro.name as 'relationship_oriented', zodiac, education, social_network, physical, pet, music, mb.language
                from person p, relationship_oriented ro, my_basics mb
                where p.id = mb.person_id and ro.id = p.relationship_oriented_id and p.id = ?`;
    db.query(query, [personId], (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
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
            res.json({ message: 'profile update successfully' });
            console.log(results);
        }
    });
};
const getTopLike = (req, res) => {
    const query = `select target_id,full_name, GROUP_CONCAT(DISTINCT image SEPARATOR ',') as image, count(target_id) as 'numOfLike'
                    from Honeyaa.like l, person p, profile_img i
                    where l.target_id = p.id and p.id = i.person_id
                    group by target_id,full_name
                    order by numOfLike desc
                    LIMIT 10`;
    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
        }
        res.send(result);
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

  const getNotification = async (userId) => {
    try {
        const query = `SELECT ps.full_name as 'user', lt.name as 'interact', l.create_at as 'time'  
                        FROM \`like\` l, person ps, like_type lt 
                        where l.target_id = 2 and l.person_id = ps.id and l.type_id = lt.id and lt.id != 2
                        ORDER BY l.create_at DESC;`;
        return new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    } catch (e) {
        console.log(e);
        throw e;
    }
  }

const potentialLover = async (user) => {
    try {
        return new Promise((resolve, reject) => {
            db.query(`
                SELECT p.id, p.full_name, p.dob, p.phone, p.sex, p.sex_oriented, p.relationship_oriented_id, p.about_me 
                FROM person p
                WHERE
                    p.id != ${user.id} and
                    p.sex = ${user.sex_oriented} and
                    NOT EXISTS (
                        SELECT * FROM honeyaa.like l
                        WHERE (l.target_id = p.id and l.person_id = ${user.id}) or (l.target_id = ${user.id} and l.person_id = p.id and l.is_matched = 1)
                    )`, (err, result) => {
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
}

const getImageByUserId = async (person_id) => {
    const createFullImageList = async (images) => {
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
        return await createFullImageList(result);
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
        })
    } catch (error) {
        console.log(error);
    }
};

const getRelationshipOrientedByUserId = async (userId) => {
    try {
        return new Promise((resolve, reject) => {
            db.query(`
                SELECT ro.name, ro.id
                FROM relationship_oriented ro, person ps   
                where ps.relationship_oriented_id = ro.id and ps.id = ${userId}
            `, (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
            });
        })
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getUserList,
    getRecommendationUserDataList,
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
    putProfile,
    updateMyBasic,
    getTopLike,
    getUserInfoByToken,
    potentialLover,
    getImageByUserId,
    getMyInterestByUserId,
    getRelationshipOrientedByUserId,
    getNotification,
};
