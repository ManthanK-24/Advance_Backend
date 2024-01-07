import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
     // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      //cb(null, file.fieldname + '-' + uniqueSuffix)
    
    // not good practice as file with same name can come multiple times
    cb(null, file.originalname)

    }
  })
  
  export const upload = multer({ storage: storage })