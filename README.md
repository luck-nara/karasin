# Karasin Travel (React + Node + PostgreSQL + Cloudinary)

เว็บแอปแนะนำสถานที่ท่องเที่ยว (CRUD) แยกเป็น 2 ส่วน:

- `frontend/`: React + TypeScript (Vite)
- `backend/`: Node.js + Express + TypeScript (REST API)
- `PostgreSQL`: เก็บข้อมูลสถานที่
- `Cloudinary`: เก็บไฟล์รูปภาพ (อัปโหลดจาก Frontend แล้วบันทึก URL ลง DB)

## โครงสร้าง

```
.
├─ backend/
│  ├─ src/
│  │  ├─ db/ (pool + migrate)
│  │  ├─ routes/places.ts
│  │  └─ index.ts
│  └─ sql/001_create_places.sql
├─ frontend/
│  └─ src/
│     ├─ api/places.ts
│     ├─ pages/ (list/detail/form)
│     └─ storage/uploadImage.ts
└─ docker-compose.yml
```

## REST API

Base URL: `http://localhost:4000`

- `GET /health`
- `GET /api/places` รายการสถานที่
- `GET /api/places/:id` ดูรายละเอียด
- `POST /api/places` เพิ่ม
- `PUT /api/places/:id` แก้ไข
- `DELETE /api/places/:id` ลบ

ตัวอย่าง payload:

```json
{
  "name": "ภูสิงห์",
  "description": "จุดชมวิว...",
  "location": "อ.เมือง",
  "province": "กาฬสินธุ์",
  "tags": ["ธรรมชาติ", "วิวสวย"],
  "imageUrl": "https://..."
}
```

## ตั้งค่าและรัน

### 1) PostgreSQL

มีไฟล์ `docker-compose.yml` ให้ แต่ต้องเปิด Docker Desktop/Engine ก่อน (ถ้ายังไม่รัน ให้เปิด Docker แล้วค่อยสั่ง):

```bash
docker compose up -d
```

หรือใช้ PostgreSQL ที่ติดตั้งเองก็ได้ ขอแค่ได้ `DATABASE_URL` ถูกต้อง

### 2) Backend

สร้างไฟล์ `.env` จากตัวอย่าง:

- คัดลอก `backend/.env.example` เป็น `backend/.env`
- แก้ `DATABASE_URL` ให้ตรงกับเครื่อง

รัน migration เพื่อสร้างตาราง:

```bash
cd backend
npm run migrate
```

รัน API:

```bash
cd backend
npm run dev
```

### 3) Frontend + Cloudinary

สร้างไฟล์ `.env` จากตัวอย่าง:

- คัดลอก `frontend/.env.example` เป็น `frontend/.env`
- ใส่ค่า Cloudinary: `CLOUD_NAME` และ `UPLOAD_PRESET` (unsigned upload preset)

รันเว็บ:

```bash
cd frontend
npm run dev
```

### 4) รันพร้อมกัน (monorepo)

ที่ root:

```bash
npm run dev
```

## หมายเหตุ Cloudinary

โปรเจคนี้อัปโหลดรูปจากฝั่ง Frontend ไป Cloudinary โดยตรง แล้วเอา URL ที่ได้ไปบันทึกใน PostgreSQL ผ่าน REST API  
ถ้ายังไม่ตั้งค่า Cloudinary, แอปยังเปิดได้ แต่ “การอัปโหลดรูป” จะขึ้น error แจ้งว่าขาด env ของ Cloudinary

