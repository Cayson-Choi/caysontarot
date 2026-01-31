"""
카드 관리 클래스
카드 로딩, 랜덤 선택, 중복 방지 등
"""
import os
import random
from pathlib import Path


class CardManager:
    """타로 카드 관리"""

    def __init__(self, cards_dir="cards"):
        self.cards_dir = Path(cards_dir)
        self.all_cards = []  # 모든 카드 파일 목록
        self.available_cards = []  # 사용 가능한 카드 목록
        self.used_cards = []  # 이미 뽑은 카드 목록

        self.load_cards()

    def load_cards(self):
        """cards 폴더에서 모든 카드 이미지 로드"""
        if not self.cards_dir.exists():
            raise FileNotFoundError(f"카드 폴더를 찾을 수 없습니다: {self.cards_dir}")

        # .jpg 파일만 로드
        self.all_cards = sorted([
            f for f in self.cards_dir.glob("*.jpg")
            if f.is_file()
        ])

        if not self.all_cards:
            raise ValueError("카드 이미지 파일이 없습니다!")

        print(f"총 {len(self.all_cards)}장의 카드를 로드했습니다.")
        self.reset()

    def reset(self):
        """카드 덱 초기화 (모든 카드를 다시 사용 가능하게)"""
        self.available_cards = self.all_cards.copy()
        self.used_cards = []
        random.shuffle(self.available_cards)

    def draw_card(self):
        """
        랜덤하게 카드 1장 뽑기

        Returns:
            Path: 선택된 카드 파일 경로
            None: 더 이상 뽑을 카드가 없을 때
        """
        if not self.available_cards:
            print("더 이상 뽑을 카드가 없습니다!")
            return None

        # 랜덤 선택
        card = self.available_cards.pop()
        self.used_cards.append(card)

        return card

    def draw_multiple(self, count):
        """
        여러 장의 카드 뽑기

        Args:
            count: 뽑을 카드 수

        Returns:
            list: 선택된 카드들의 경로 리스트
        """
        if count > len(self.available_cards):
            print(f"경고: 요청한 {count}장보다 적은 {len(self.available_cards)}장만 가능합니다.")
            count = len(self.available_cards)

        cards = []
        for _ in range(count):
            card = self.draw_card()
            if card:
                cards.append(card)

        return cards

    def get_card_name(self, card_path):
        """
        파일명에서 카드 이름 추출

        Args:
            card_path: 카드 파일 경로

        Returns:
            str: 카드 이름 (확장자 제거)
        """
        if isinstance(card_path, Path):
            return card_path.stem
        return Path(card_path).stem

    def get_remaining_count(self):
        """남은 카드 수 반환"""
        return len(self.available_cards)

    def get_used_count(self):
        """사용한 카드 수 반환"""
        return len(self.used_cards)

    def get_total_count(self):
        """전체 카드 수 반환"""
        return len(self.all_cards)


if __name__ == "__main__":
    # 테스트
    try:
        manager = CardManager()

        print(f"\n전체 카드: {manager.get_total_count()}장")
        print(f"남은 카드: {manager.get_remaining_count()}장")

        # 카드 3장 뽑기 테스트
        print("\n3장 뽑기:")
        cards = manager.draw_multiple(3)
        for card in cards:
            print(f"  - {manager.get_card_name(card)}")

        print(f"\n남은 카드: {manager.get_remaining_count()}장")

        # 초기화 테스트
        print("\n덱 초기화...")
        manager.reset()
        print(f"남은 카드: {manager.get_remaining_count()}장")

    except Exception as e:
        print(f"오류: {e}")
