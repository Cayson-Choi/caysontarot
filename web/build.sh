#!/bin/bash
# Vercel Build Output API v3 구조로 정적 파일 배포

# output 디렉토리 생성
mkdir -p .vercel/output/static

# 정적 파일들을 static 폴더로 복사
cp index.html .vercel/output/static/
cp app.js .vercel/output/static/
cp ai.js .vercel/output/static/
cp styles.css .vercel/output/static/
cp -r public .vercel/output/static/

# config.json 생성
cat > .vercel/output/config.json << 'EOF'
{
  "version": 3
}
EOF

echo "Static files copied to .vercel/output/static/"
