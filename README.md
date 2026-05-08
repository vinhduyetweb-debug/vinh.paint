# Bé Tô Màu - Working Build

Bản này sửa lại kiến trúc:
- `paintCanvas`: lớp tô màu, nhận sự kiện chuột/cảm ứng.
- `lineCanvas`: lớp nét vẽ phía trên, không nhận sự kiện.
- Vì vậy màu sẽ hiện rõ và nét tranh không bị che.

Deploy Vercel: kéo thả thư mục hoặc chạy `vercel --prod`.
