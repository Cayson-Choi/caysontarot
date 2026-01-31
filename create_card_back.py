"""
카드 뒷면 이미지 생성 스크립트
클래식한 타로 카드 뒷면 디자인
"""
from PIL import Image, ImageDraw
import math

def create_card_back(width=300, height=500, output_path="assets/card_back.png"):
    """클래식한 타로 카드 뒷면 이미지 생성"""

    # 이미지 생성 (진한 보라색 배경)
    img = Image.new('RGB', (width, height), color='#1a0033')
    draw = ImageDraw.Draw(img)

    # 외곽 테두리 (골드색)
    border_color = '#d4af37'
    border_width = 8
    for i in range(border_width):
        draw.rectangle(
            [(i, i), (width-1-i, height-1-i)],
            outline=border_color,
            width=1
        )

    # 내부 테두리 (연한 보라색)
    inner_border = 20
    draw.rectangle(
        [(inner_border, inner_border), (width-inner_border, height-inner_border)],
        outline='#6b4c9a',
        width=3
    )

    # 중앙 원형 패턴
    center_x = width // 2
    center_y = height // 2

    # 큰 원 (중앙)
    circle_radius = 80
    draw.ellipse(
        [(center_x - circle_radius, center_y - circle_radius),
         (center_x + circle_radius, center_y + circle_radius)],
        outline='#d4af37',
        width=3
    )

    # 작은 원들 (동심원)
    for r in [60, 40, 20]:
        draw.ellipse(
            [(center_x - r, center_y - r),
             (center_x + r, center_y + r)],
            outline='#9370db',
            width=2
        )

    # 중앙 별 패턴 (8방향)
    star_points = 8
    outer_radius = 70
    inner_radius = 30

    points = []
    for i in range(star_points * 2):
        angle = math.pi * i / star_points - math.pi / 2
        radius = outer_radius if i % 2 == 0 else inner_radius
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        points.append((x, y))

    draw.polygon(points, outline='#d4af37', width=2)

    # 모서리 장식 (작은 원들)
    corner_offset = 40
    corner_radius = 15
    corners = [
        (corner_offset, corner_offset),
        (width - corner_offset, corner_offset),
        (corner_offset, height - corner_offset),
        (width - corner_offset, height - corner_offset)
    ]

    for cx, cy in corners:
        draw.ellipse(
            [(cx - corner_radius, cy - corner_radius),
             (cx + corner_radius, cy + corner_radius)],
            outline='#d4af37',
            fill='#4b0082',
            width=2
        )
        # 내부 작은 원
        small_r = 8
        draw.ellipse(
            [(cx - small_r, cy - small_r),
             (cx + small_r, cy + small_r)],
            fill='#d4af37'
        )

    # 상하단 장식 라인
    for y in [60, height - 60]:
        draw.line(
            [(inner_border + 20, y), (width - inner_border - 20, y)],
            fill='#6b4c9a',
            width=2
        )

    # 저장
    img.save(output_path)
    print(f"카드 뒷면 이미지 생성 완료: {output_path}")
    return output_path

if __name__ == "__main__":
    create_card_back()
