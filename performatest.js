import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics untuk laporan yang lebih detail
const responseTimeTrend = new Trend('waiting_time');
const successRate = new Rate('successful_requests');

export const options = {
    // KITA MENGGUNAKAN THRESHOLDS (Penentu Lulus/Gagal Otomatis)
    thresholds: {
        http_req_failed: ['rate<0.01'], // Gagal jika error > 1%
        http_req_duration: ['p(95)<500'], // 95% request harus di bawah 500ms
    },
    
    // PILIH SALAH SATU SKENARIO DI BAWAH (Uncomment yang ingin dipakai)
    
    // A. LOAD TEST (Beban normal pengguna harian)
    /*
    stages: [
        { duration: '1m', target: 50 }, // Naik ke 50 user dalam 1 menit
        { duration: '3m', target: 50 }, // Bertahan di 50 user selama 3 menit
        { duration: '1m', target: 0 },  // Turun ke 0
    ],
    */

    // B. STRESS TEST (Mencari titik batas sistem - Spike)
    stages: [
        { duration: '2m', target: 100 }, // Normal
        { duration: '1m', target: 400 }, // LONJAKAN DRATIS (Spike)
        { duration: '2m', target: 400 }, // Tahan di beban tinggi
        { duration: '1m', target: 0 },   // Recovery
    ],
};

export default function () {
    // 1. Mengakses Halaman Utama
    const res = http.get('https://test.k6.io');
    
    // 2. Melakukan Validasi (Checks)
    const checkRes = check(res, {
        'status is 200': (r) => r.status === 200,
        'page contains welcome': (r) => r.body.includes('Welcome'),
    });

    // 3. Mencatat metrik kustom
    successRate.add(checkRes);
    responseTimeTrend.add(res.timings.waiting);

    // 4. Simulasi User Journey (User tidak langsung klik, tapi baca dulu)
    sleep(Math.random() * 3 + 1); // Random sleep 1-4 detik
}