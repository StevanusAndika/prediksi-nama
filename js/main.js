// URL dasar API yang digunakan untuk prediksi gender berdasarkan nama
const base_api = "https://api.genderize.io";

// Variabel untuk menyimpan timestamp permintaan terakhir
let lastRequestTime = 0;

// Waktu tunggu minimum antar request dalam milidetik (3 detik)
const requestCooldown = 3000;

// Fungsi untuk memprediksi gender berdasarkan nama yang dimasukkan
const predict = async (event) => {
    event.preventDefault(); // Mencegah form melakukan submit default

    // Mengambil elemen input dan hasil dari DOM
    const nameInput = document.getElementById("nama");
    const resultDiv = document.getElementById("result");

    // Mengambil nilai input, menghapus spasi berlebih, dan mengonversinya ke huruf kecil
    const name = nameInput.value.trim().toLowerCase();

    // Validasi: Jika input kosong, tampilkan notifikasi dan hentikan eksekusi
    if (!name) {
        Notiflix.Notify.failure("Nama tidak boleh kosong!");
        return;
    }

    // Cek apakah pengguna mengirim request terlalu cepat (kurang dari 3 detik sejak request terakhir)
    const currentTime = Date.now();
    if (currentTime - lastRequestTime < requestCooldown) {
        Notiflix.Notify.warning("Tunggu sebentar sebelum mencoba lagi!");
        return;
    }
    
    // Perbarui timestamp permintaan terakhir
    lastRequestTime = currentTime;

    // Mengecek apakah hasil prediksi sudah tersedia di cache (LocalStorage)
    const cachedResult = localStorage.getItem(`gender_${name}`);
    if (cachedResult) {
        // Jika ada, parsing hasil dari cache dan tampilkan ke pengguna
        const data = JSON.parse(cachedResult);
        resultDiv.innerHTML = `Prediksi Gender: <strong>${data.gender}</strong> (Akurasi: ${(data.probability * 100).toFixed(2)}%)`;
        Notiflix.Notify.info("Menggunakan data dari cache.");
        return;
    }

    try {
        // Menampilkan indikator loading saat request berlangsung
        Notiflix.Loading.arrows("Memproses...");

        // Mengirim request ke API Genderize dengan parameter nama
        const response = await fetch(`${base_api}/?name=${name}`);

        // Jika server mengembalikan kode status 429 (terlalu banyak request), tampilkan notifikasi dan hentikan eksekusi
        if (response.status === 429) {
            Notiflix.Loading.remove();
            Notiflix.Notify.failure("Terlalu banyak permintaan! Coba lagi nanti.");
            return;
        }

        // Mengambil hasil response dalam format JSON
        const data = await response.json();
        Notiflix.Loading.remove(); // Menghapus indikator loading setelah request selesai

        // Jika API berhasil menemukan gender berdasarkan nama yang diberikan
        if (data.gender) {
            resultDiv.innerHTML = `Prediksi Gender: <strong>${data.gender}</strong> (Akurasi: ${(data.probability * 100).toFixed(2)}%)`;
            Notiflix.Notify.success("Prediksi berhasil!");
            // Menyimpan hasil prediksi ke LocalStorage agar bisa digunakan kembali tanpa request ulang
            localStorage.setItem(`gender_${name}`, JSON.stringify(data));
        } else {
            // Jika nama tidak ditemukan dalam database API
            resultDiv.innerHTML = "Nama tidak ditemukan dalam database.";
            Notiflix.Notify.warning("Nama tidak ditemukan!");
        }
    } catch (error) {
        // Menangani kesalahan jaringan atau lainnya dan menampilkan notifikasi ke pengguna
        console.error("Error:", error);
        Notiflix.Loading.remove();
        Notiflix.Notify.failure("Terjadi kesalahan, coba lagi nanti!");
    }
};

// Fungsi untuk membersihkan input dan hasil prediksi dari tampilan
const clearInput = () => {
    document.getElementById("nama").value = ""; // Mengosongkan input
    document.getElementById("result").innerHTML = ""; // Menghapus hasil yang ditampilkan
    Notiflix.Notify.success("Data berhasil dibersihkan!"); // Menampilkan notifikasi sukses
};
