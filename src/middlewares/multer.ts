import multerMulter from "multer";

const storage = multerMulter.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, "uploads/");
  },
  filename: function (req: any, file: any, cb: any) {
    const ext = file.originalname.split(".");
    cb(null, Math.random().toString(32).slice(-7) + "." + ext[1]);
  },
});

export const multer = multerMulter({ storage: storage });
