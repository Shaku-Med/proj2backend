const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const {
    Server
} = require("socket.io")
const multer = require('multer')
const fs = require('fs')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcrypt')
const store = require('store')
const {
    uuid
} = require('uuidv4')
const mysql = require("mysql")


// Configurations...

app.use(express());

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3000'],
    methods: ['POST']
}));

app.use(bodyParser.json() || bodyParser.urlencoded({
    extended: false
}));


// djfodbfodb...


// Database...

let mydb = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'music',
    charset: 'utf8mb4',
    multipleStatements: false
};

let db;

function handleDisconnect() {
    db = mysql.createConnection(mydb);

    db.connect(function(err) {
        if (err) {
            console.log("error when connecting to db ", err);
            setTimeout(handleDisconnect, 2000);
        }
    });

    db.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();


// Socket.connection


const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3000'],
    }
});

app.use(['/Images/'], express.static('Images'));
app.use(['/Audio/'], express.static('Audio'));

// End of socket.s


// Sign up now for user now ready...

app.post("/users/signup/auth", (req, res) => {
    db.query("SELECT * FROM usr WHERE email=?", [req.body.semail], async (e, r) => {
        if (r.length > 0) {
            r.map(val => { 
                let regix = /\s+/g;
                let names = req.body.fname + " " + req.body.lname
                let realname = val.fname + " " + val.lname
                let co_name = names.replace(regix, " ")
                let r_name = realname.replace(regix, " ")
               
                if(co_name.toUpperCase() === r_name.toUpperCase()){ 
                    let arr = {
                        success: "This name is not found."
                    }
                    res.send(arr)
                }
                else { 
                    let arr = {
                        success: "This account already exist."
                    }
                    res.send(arr)
                }
            })
        } else {
            let salt = await bcrypt.genSalt(10)
            req.body.spass = await bcrypt.hash(req.body.spass, salt)
            let websiteurl= "";
            let description = "";

            let bgw = ""
            let bgh = ""
            let bgp = ""

            db.query("INSERT INTO usr (fname, lname,  email, pass, c_usr, xs, _g, pageid, profilepic, coverpic, websiteurl, description, bgw, bgh, bgp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.body.fname, req.body.lname, req.body.semail, req.body.spass, req.body.unic_id, req.body.xs, req.body._g, req.body.pageid, req.body.profilepic, req.body.coverpic, websiteurl, description, bgw, bgh, bgp], (er, re) => {
                db.query("SELECT * FROM usr WHERE email=?", [req.body.semail], (es, rs) => {
                    if (rs.length > 0) {
                        rs.map(val => {
                            let arr = {
                                success: "success",
                                c_usr: val.c_usr,
                                xs: val.xs,
                                _g: val._g,
                                pageid: val.pageid
                            }
                            res.send(arr)
                        })
                    }
                })
            })
        }
    })
})



// Login Now... Parts...

app.post("/users/login/auth", (req, res) => { 
    db.query( "SELECT * FROM usr WHERE email=?", [ req.body.email ], ( e, r ) =>
    {
          if ( r.length > 0 )
          {
                r.map( async val =>
                    {
                        let passcompare = await bcrypt.compare( req.body.pass, val.pass );
                        if(passcompare){ 

                            let successinfo = {
                                success: "success",
                                c_usr: val.c_usr,
                                xs: val.xs,
                                _g: val._g,
                                pageid: val.pageid
                            };
                            res.send(successinfo)

                        }
                        else { 
                            let successinfo = {
                                success: 'Your email or password is not correct.',
                          };
                          res.send(successinfo)
                        }
                    }
               )
         }
         else { 
            let successinfo = {
                success: 'Account does not exist',
          };
          res.send(successinfo)
         }
    }
  )
})


// UPloads

let covercode = uuid()
const coverdirectory = './Audio/'

const coverstorage = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, coverdirectory)
    },
    filename: (req, file, cb) => { 
        const fileName = file.originalname.toLocaleLowerCase().split(' ').join('-');
        let nameof = cb(null,  fileName)
        store.set("coverimage", fileName)
    }
})

const coverupload = multer({ 
    storage: coverstorage
})

// SDODNDODI

let image_code = uuid()
const audioimag_d = './Images/'

const audio_img_store = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, audioimag_d)
    },
    filename: (req, file, cb) => { 
        const fileName = file.originalname.toLocaleLowerCase().split(' ').join('-');
        let nameof = cb(null,  fileName)
        store.set("adioimg", fileName)
    }
})

const aud_img_up = multer({ 
    storage: audio_img_store
})



app.post("/upload/Image/send", aud_img_up.single("songimg"), (reqs, ress) => {})

app.post("/upload/audio/send", coverupload.single('songaudio'), (req, res) => { 
    let imageurl = "http://localhost:3001/Images/" + store.get("adioimg");
    let audiourl = "http://localhost:3001/Audio/" + store.get("coverimage");
    
    db.query("SELECT * FROM usr WHERE c_usr=?", [req.body.c_usr], (e, r) => { 
        if(r.length > 0){ 
            db.query("INSERT INTO audios (ownerid, songt, songd, songimg, songaudio, songtype, audio_id, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [req.body.c_usr, req.body.songt, req.body.songd, imageurl, audiourl, req.body.songtype, req.body.audio_id, req.body.date], (er, re) => { 
                db.query("SELECT * FROM audios WHERE ownerid=?", [req.body.c_usr], (es, rs) => { 
                    if(rs.length > 0){ 
                        res.send("success")
                    }
                })
            })
        }
    })
})

app.post("/user/data/info", (req, res) => { 
    db.query("SELECT bgh, bgp, bgw, c_usr, coverpic, profilepic, description, email, fname, lname, pageid, websiteurl, xs, _g FROM usr WHERE c_usr=?", [req.body.c_usr], (e, r) => { 
        if(r.length > 0){ 
            res.send(r)
        }
        else { 
            res.send("notfound")
        }
    })
})


app.post("/user/profile/info", (req, res) => { 
    db.query("SELECT bgh, bgp, bgw, c_usr, coverpic, profilepic, description, email, fname, lname, pageid, websiteurl, xs, _g FROM usr WHERE pageid=?", [req.body.pageid], (e, r) => { 
        if(r.length > 0){ 
            res.send(r)
        }
        else { 
            res.send("notfound")
        }
    })
})

app.post("/audio/posted/usr", (req, res) => { 
    db.query("SELECT * FROM audios WHERE ownerid=?", [req.body.ownerid], (e, r) => { 
        if(r.length > 0){ 
            res.send(r)
        }
        else { 
            res.send("notfound")
        }
    })
})

app.post("/friends/users/alls", (req, res) => { 
    db.query("SELECT c_usr, coverpic, profilepic, description, fname, lname, pageid FROM usr", (e, r) => { 
        if(r.length > 0){ 
            res.send(r)
        }
        else { 
            res.send("notfound")
        }
    })
})

app.post("/main/self", (req, res) => { 
   db.query("SELECT * FROM usr WHERE c_usr=?", [req.body.c_usr], (er, re) => { 
        if(re.length > 0){ 
            db.query("SELECT usr.fname, usr.lname, usr.c_usr, usr.email, usr.profilepic, usr.pageid, audios.ownerid, audios.songt, audios.songd, audios.songimg, audios.songaudio, audios.songtype, audios.audio_id, audios.date FROM usr, audios", (e, r) => { 
               if(r.length > 0){ 
                 res.send(r)
               }
               else { 
                res.send("notfound")
               }
            })
        }
        else { 
            res.send("notfound")
        }
   })
})

app.post("/actual_us/us", (req, res) => { 
    db.query("SELECT usr.fname, usr.lname, usr.c_usr, usr.email, usr.profilepic, usr.pageid, audios.ownerid, audios.songt, audios.songd, audios.songimg, audios.songaudio, audios.songtype, audios.audio_id, audios.date FROM usr, audios WHERE c_usr=? AND ownerid=?", [req.body.uuid, req.body.uuid], (e, r) => { 
        if(r.length > 0){ 
          res.send(r)
        }
        else { 
         res.send("notfound")
        }
     })
})


server.listen(3001, () => {
    console.log("Listening...")
})