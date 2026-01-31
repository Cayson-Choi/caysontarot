"""
타로 스프레드 정의
각 스프레드의 카드 장수와 위치별 의미 정의
"""

class Spread:
    """스프레드 클래스"""
    def __init__(self, name, count, positions):
        self.name = name
        self.count = count
        self.positions = positions  # 각 위치의 의미

    def __repr__(self):
        return f"Spread({self.name}, {self.count}장)"


# 스프레드 정의
SPREADS = {
    'one_card': Spread(
        name="원 카드",
        count=1,
        positions=[
            "오늘의 메시지"
        ]
    ),

    'three_card': Spread(
        name="쓰리 카드",
        count=3,
        positions=[
            "과거",
            "현재",
            "미래"
        ]
    ),

    'relationship': Spread(
        name="관계 스프레드",
        count=7,
        positions=[
            "나의 현재 상태",
            "상대방의 현재 상태",
            "나의 감정",
            "상대방의 감정",
            "관계의 장애물",
            "관계의 잠재력",
            "최종 결과"
        ]
    ),

    'celtic_cross': Spread(
        name="켈틱 크로스",
        count=10,
        positions=[
            "현재 상황",
            "장애물/도전",
            "과거의 영향",
            "가까운 미래",
            "목표/이상",
            "잠재의식",
            "조언",
            "외부 영향",
            "희망과 두려움",
            "최종 결과"
        ]
    ),

    'custom': Spread(
        name="커스텀",
        count=0,  # 사용자 선택
        positions=[]  # 동적 생성
    )
}


def get_spread(spread_type, custom_count=None):
    """
    스프레드 가져오기

    Args:
        spread_type: 스프레드 타입 키
        custom_count: 커스텀 스프레드의 경우 카드 수

    Returns:
        Spread 객체
    """
    if spread_type == 'custom' and custom_count:
        positions = [f"카드 {i+1}" for i in range(custom_count)]
        return Spread("커스텀", custom_count, positions)

    return SPREADS.get(spread_type)


def get_spread_info():
    """모든 스프레드 정보 반환 (UI 표시용)"""
    return {
        'one_card': {
            'name': '원 카드',
            'description': '오늘의 운세, 간단한 질문',
            'count': 1
        },
        'three_card': {
            'name': '쓰리 카드',
            'description': '과거-현재-미래',
            'count': 3
        },
        'relationship': {
            'name': '관계 스프레드',
            'description': '나와 상대방의 관계 분석',
            'count': 7
        },
        'celtic_cross': {
            'name': '켈틱 크로스',
            'description': '가장 포괄적인 종합 리딩',
            'count': 10
        },
        'custom': {
            'name': '커스텀',
            'description': '1~10장 자유 선택',
            'count': 0
        }
    }


if __name__ == "__main__":
    # 테스트
    for key, spread in SPREADS.items():
        if key != 'custom':
            print(f"\n{spread.name} ({spread.count}장)")
            for i, pos in enumerate(spread.positions, 1):
                print(f"  {i}. {pos}")
