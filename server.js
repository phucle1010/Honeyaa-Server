const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')
require('dotenv').config();
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN);
const app = express();
const PORT = 8080;
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'Honeyaa'
});


// Kết nối cơ sở dữ liệu
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected');
});

// verifyPhone Endpoint
app.get('/verifyPhone', (req, res) => {
  if (req.query.phonenumber) {
    db.query('SELECT * FROM user WHERE phone = ?', [req.query.phonenumber], (error, results) => {
      if (error) {
        res.status(500).json({ error });
      } else if (results.length === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        client
          .verify.v2
          .services(process.env.TWILIO_SERVICE_SID)
          .verifications
          .create({
            to: `+84${req.query.phonenumber}`, channel: "sms"
          })
          .then(data => {
            res.status(200).send({
              message: "Verification is sent!!",
              phonenumber: req.query.phonenumber,
              data
            })
          })
      }
    }
)
  }
  else {
    res.status(400).send({
      message: "Wrong phone number :(",
      phonenumber: req.query.phonenumber,
      data
    })
  }
})

// Verify Endpoint
app.get('/verifyOTP', (req, res) => {
  if (req.query.phonenumber && (req.query.code).length === 4) {
    client
      .verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks
      .create({
        to: `+84${req.query.phonenumber}`, code: req.query.code
      })
      .then(data => {
        if (data.status === "approved") {
          res.status(200).send({
            message: "User is Verified!!",
            data
          })
        }
      })
  } else {
    res.status(400).send({
      message: "Wrong phone number or code :(",
      phonenumber: req.query.phonenumber,
      data
    })
  }
})



app.get('/user', (req, res) => {
  console.log('param: ', req.query)
  const sql = `SELECT * FROM honeyaa.user`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// API endpoint để đăng ký người dùng và gửi email xác thực
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const token = jwt.sign({ username, email }, 'secret_key');
  const emailBody = `Click the following link to activate your account: http://localhost:8080/activate/${token}`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'example@gmail.com',
      pass: 'examplepassword'
    }
  });
  const mailOptions = {
    from: 'example@gmail.com',
    to: email,
    subject: 'Activate your account',
    text: emailBody
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.status(500).json({ error });
    } else {
      const sql = 'INSERT INTO users (username, email, password, activated) VALUES (?, ?, ?, ?)';
      db.query(sql, [username, email, password, false], (error, results) => {
        if (error) {
          res.status(500).json({ error });
        } else {
          res.json({ message: 'User registered successfully' });
        }
      });
    }
  });
});

// API endpoint để xác thực tài khoản
app.get('/activate/:token', (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const { email } = decoded;
    const sql = 'UPDATE users SET activated = ? WHERE email = ?';
    db.query(sql, [true, email], (error, results) => {
      if (error) {
        res.status(500).json({ error });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json({ message: 'Account activated successfully' });
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// API endpoint đăng nhập token JWT
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error) {
      res.status(500).json({ error });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
    } else {
      const user = results[0];
      if (user.password === password) {
        const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key');
        res.json({ token });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    }
  });
});




// API endpoint để cập nhật lại mật khẩu
app.put('/user/:phone/pass', (req, res) => {
  const { phone } = req.params;
  const { pass } = req.body;

  const query = 'UPDATE user SET pass = ? WHERE phone = ?';
  db.query(query, [pass, phone], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else {
      console.log(result);
      res.status(200).send('Password updated successfully');
    }
  });
});

// API lấy thông tin cá nhân
app.get('/person', (req, res) => {
  const personid = req.params.personid;
  const sql = `SELECT * FROM person WHERE personid = ${personid}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// API sửa thông tin cá nhân
app.put('/person', (req, res) => {
  const personid = req.params.personid;
  const { full_name, phone_number, dob, sex, sexoriented } = req.body;
  const sql = `UPDATE person SET full_name = '${full_name}', phone_number = ${phone_number}, dob = '${dob}', sex = '${sex}', sexoriented = '${sexoriented}' WHERE personid = ${personid}`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send('User information updated successfully');
  });
});

// API gửi yêu cầu like
app.post('/likes', (req, res) => {
  const { user_id, target_id, type } = req.body;
  const created_at = new Date();

  const sql = 'INSERT INTO liked (user_id, target_id, type, created_at) VALUES (?, ?, ?, ?)';
  db.query(sql, [user_id, target_id, 'like', created_at], (err, result) => {
    if (err) throw err;
    res.status(201).json({ message: 'Like created successfully!' });
  });
});

// Api gửi yêu cầu super like
app.post('/superlikes', (req, res) => {
  const { user_id, target_id } = req.body;
  const created_at = new Date();

  const sql = 'INSERT INTO liked (user_id, target_id, type, created_at) VALUES (?, ?, ?, ?)';
  db.query(sql, [user_id, target_id, 'super', created_at], (err, result) => {
    if (err) throw err;
    res.status(201).json({ message: 'Super like created successfully!' });
  });
});

// API endpoint để lấy danh sách tương hợp
app.get('/compatible', (req, res) => {
  db.query('SELECT * FROM compatible', (error, results) => {
    if (error) {
      res.status(500).json({ error });
    } else {
      res.json({ person: results });
    }
  });
});

// API endpoint để lấy danh sách tuyển chọn
app.get('/topLiked', (req, res) => {
  const sql =
    `select person.personid, person.full_name, count(target_id)
    from person join liked on person.personid =  liked.target_id
    group by person.personid,person.personid
    order by count(target_id) desc ;`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// API endpoint để lấy danh sách yêu thích
app.get('/liked', (req, res) => {
  const personid = req.params.personid;// ID của người dùng đang đăng nhập
  const sql =
    `select person.personid, person.full_name
    from person join liked on person.personid =  liked.target_id
    where liked.user_id = ${personid} ;`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
// API xem toàn bộ profile trong hệ thống
app.get('/profile', (req, res) => {
  const sql =
    `SELECT person.personid, person.full_name
  FROM person 
  LEFT JOIN interst_user_relation ON person.personid = interst_user_relation.personid 
  LEFT JOIN interest ON interst_user_relation.interstid = interest.interestid`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// API xem chi tiết profile
app.get('/profileDetail', (req, res) => {
  const personid = req.params.personid;
  const sql =
    `SELECT person.personid, person.full_name, person.dob, person.sex, GROUP_CONCAT(interest.interest_name SEPARATOR ', ') AS interests
  FROM person 
  LEFT JOIN interst_user_relation ON person.personid = interst_user_relation.personid 
  LEFT JOIN interest ON interst_user_relation.interstid = interest.interestid
  where person.personid = ${personid}
  GROUP BY person.personid,person.full_name,person.dob, person.sex `;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
// API lấy nội dung chat cho đối tượng tương hợp
app.get('/chat', (req, res) => {
  const matchId = req.params.id;
  const personid = req.user.id; // ID của người dùng đang đăng nhập
  const sql = `SELECT * FROM chat WHERE (user1_id = ${personid} AND user2_id = ${matchId}) OR (user1_id = ${matchId} AND user2_id = ${personid})`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json(results);
  });
});

// API gọi video
app.get('/videos', (req, res) => {
  const videoid = req.params.videoid;
  const query = `SELECT * FROM videos WHERE id = ${videoid}`;

  db.query(query, (err, result) => {
    if (err) {
      res.status(500).send('Lỗi khi lấy video');
    } else {
      if (result.length > 0) {
        const video = result[0];
        // Trả về video dưới dạng stream
        const path = video.path;
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;

          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(path, { start, end });
          const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          };

          res.writeHead(206, head);
          file.pipe(res);
        } else {
          const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
          };
          res.writeHead(200, head);
          fs.createReadStream(path).pipe(res);
        }
      } else {
        res.status(404).send('Video không tồn tại');
      }
    }
  });
});

// API lấy danh sách bộ câu hỏi theo chủ đề
app.get('/questions/:topic', (req, res) => {
  const topic = req.params.topic;
  const sql = `SELECT * FROM questions WHERE topic = '${topic}'`;
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
