"""
타로 카드 리딩 애플리케이션
PyQt5 기반 GUI 앱
"""
import sys
import os
import json
from datetime import datetime
from pathlib import Path

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QScrollArea, QStackedWidget, QGridLayout,
    QTextEdit, QMessageBox, QDialog, QListWidget, QListWidgetItem,
    QSpinBox, QFrame
)
from PyQt5.QtCore import (
    Qt, QPropertyAnimation, QEasingCurve, pyqtSignal, QTimer, QSize
)
from PyQt5.QtGui import QPixmap, QFont, QPalette, QColor, QIcon

try:
    import pygame
    SOUND_AVAILABLE = True
except ImportError:
    SOUND_AVAILABLE = False
    print("pygame이 설치되지 않았습니다. 사운드 기능이 비활성화됩니다.")

from card_manager import CardManager
from spreads import get_spread, get_spread_info


class SoundManager:
    """사운드 효과 관리"""

    def __init__(self):
        self.enabled = SOUND_AVAILABLE
        self.muted = False

        if self.enabled:
            try:
                pygame.mixer.init()
                # 간단한 비프음으로 대체 (실제 사운드 파일이 없을 때)
                self.sounds = {}
            except Exception as e:
                print(f"사운드 초기화 실패: {e}")
                self.enabled = False

    def play(self, sound_name):
        """사운드 재생"""
        if not self.enabled or self.muted:
            return

        # 실제 사운드 파일이 있으면 재생
        # 지금은 패스
        pass

    def toggle_mute(self):
        """음소거 토글"""
        self.muted = not self.muted
        return self.muted


class CardWidget(QLabel):
    """카드 위젯 (애니메이션 포함)"""

    clicked = pyqtSignal()

    def __init__(self, width=300, height=500, parent=None):
        super().__init__(parent)
        self.card_width = width
        self.card_height = height
        self.card_path = None
        self.is_revealed = False

        self.setFixedSize(width, height)
        self.setAlignment(Qt.AlignCenter)
        self.setStyleSheet("""
            QLabel {
                border: 3px solid #fbbf24;
                border-radius: 12px;
                background-color: #1e293b;
            }
        """)

        # 카드 뒷면 표시
        self.show_back()

    def show_back(self):
        """카드 뒷면 표시"""
        back_path = Path("assets/card_back.png")
        if back_path.exists():
            pixmap = QPixmap(str(back_path))
            pixmap = pixmap.scaled(
                self.card_width, self.card_height,
                Qt.KeepAspectRatio, Qt.SmoothTransformation
            )
            self.setPixmap(pixmap)
        else:
            self.setText("🎴")
            self.setStyleSheet(self.styleSheet() + "font-size: 100px;")

        self.is_revealed = False

    def reveal_card(self, card_path, animated=True):
        """
        카드 공개 (애니메이션)

        Args:
            card_path: 카드 이미지 경로
            animated: 애니메이션 사용 여부
        """
        self.card_path = card_path

        if animated:
            self._animate_reveal()
        else:
            self._show_card()

    def _animate_reveal(self):
        """카드 공개 애니메이션 (페이드인)"""
        # 투명도 애니메이션
        self.setWindowOpacity(0.0)

        # 카드 이미지 로드
        self._show_card()

        # 페이드인 애니메이션
        self.fade_animation = QPropertyAnimation(self, b"windowOpacity")
        self.fade_animation.setDuration(500)
        self.fade_animation.setStartValue(0.0)
        self.fade_animation.setEndValue(1.0)
        self.fade_animation.setEasingCurve(QEasingCurve.InOutQuad)
        self.fade_animation.start()

    def _show_card(self):
        """카드 이미지 표시"""
        if self.card_path and Path(self.card_path).exists():
            pixmap = QPixmap(str(self.card_path))
            pixmap = pixmap.scaled(
                self.card_width, self.card_height,
                Qt.KeepAspectRatio, Qt.SmoothTransformation
            )
            self.setPixmap(pixmap)
            self.is_revealed = True

    def mousePressEvent(self, event):
        """마우스 클릭 이벤트"""
        self.clicked.emit()


class MainMenuWidget(QWidget):
    """메인 메뉴 화면"""

    spread_selected = pyqtSignal(str, int)  # (spread_type, count)
    show_history = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.init_ui()

    def init_ui(self):
        """UI 초기화"""
        layout = QVBoxLayout()
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)

        # 타이틀
        title = QLabel("🎴 타로 카드 리딩")
        title.setFont(QFont("Arial", 36, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        # 부제
        subtitle = QLabel("스프레드를 선택하세요")
        subtitle.setFont(QFont("Arial", 18))
        subtitle.setAlignment(Qt.AlignCenter)
        subtitle.setStyleSheet("color: #a78bfa; margin-bottom: 20px; font-weight: 500;")
        layout.addWidget(subtitle)

        # 스프레드 버튼들
        spreads_info = get_spread_info()

        # 그리드 레이아웃 (2열)
        grid_layout = QGridLayout()
        grid_layout.setSpacing(15)

        spread_keys = ['one_card', 'three_card', 'relationship', 'celtic_cross', 'custom']
        for i, key in enumerate(spread_keys):
            info = spreads_info[key]
            btn = self.create_spread_button(key, info)
            row = i // 2
            col = i % 2
            grid_layout.addWidget(btn, row, col)

        layout.addLayout(grid_layout)

        # 히스토리 버튼
        history_btn = QPushButton("📚 히스토리 보기")
        history_btn.setFont(QFont("Arial", 14, QFont.Bold))
        history_btn.setFixedSize(350, 60)
        history_btn.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #0ea5e9, stop:1 #3b82f6);
                color: white;
                border: 2px solid #38bdf8;
                border-radius: 12px;
                padding: 10px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #38bdf8, stop:1 #60a5fa);
                border: 2px solid #7dd3fc;
            }
            QPushButton:pressed {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #0284c7, stop:1 #2563eb);
            }
        """)
        history_btn.clicked.connect(self.show_history.emit)
        layout.addWidget(history_btn, alignment=Qt.AlignCenter)

        layout.addStretch()
        self.setLayout(layout)

    def create_spread_button(self, key, info):
        """스프레드 버튼 생성"""
        btn = QPushButton()
        btn.setFixedSize(380, 120)

        # 버튼 텍스트
        text = f"{info['name']}"
        if info['count'] > 0:
            text += f" ({info['count']}장)"
        text += f"\n{info['description']}"

        btn.setText(text)
        btn.setFont(QFont("Arial", 13))
        btn.setStyleSheet(self.get_button_style("#6b4c9a"))

        # 클릭 이벤트
        if key == 'custom':
            btn.clicked.connect(self.select_custom_spread)
        else:
            btn.clicked.connect(lambda: self.spread_selected.emit(key, info['count']))

        return btn

    def select_custom_spread(self):
        """커스텀 스프레드 선택 다이얼로그"""
        dialog = QDialog(self)
        dialog.setWindowTitle("커스텀 스프레드")
        dialog.setFixedSize(300, 150)

        layout = QVBoxLayout()

        label = QLabel("뽑을 카드 수를 선택하세요:")
        label.setFont(QFont("Arial", 12))
        layout.addWidget(label)

        spinbox = QSpinBox()
        spinbox.setMinimum(1)
        spinbox.setMaximum(10)
        spinbox.setValue(3)
        spinbox.setFont(QFont("Arial", 14))
        layout.addWidget(spinbox)

        btn_layout = QHBoxLayout()
        ok_btn = QPushButton("확인")
        ok_btn.clicked.connect(dialog.accept)
        cancel_btn = QPushButton("취소")
        cancel_btn.clicked.connect(dialog.reject)

        btn_layout.addWidget(ok_btn)
        btn_layout.addWidget(cancel_btn)
        layout.addLayout(btn_layout)

        dialog.setLayout(layout)

        if dialog.exec_() == QDialog.Accepted:
            count = spinbox.value()
            self.spread_selected.emit('custom', count)

    def get_button_style(self, color):
        """버튼 스타일 - 모던 그라데이션"""
        return """
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #6366f1, stop:0.5 #8b5cf6, stop:1 #a855f7);
                color: white;
                border: 2px solid #fbbf24;
                border-radius: 12px;
                padding: 15px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #818cf8, stop:0.5 #a78bfa, stop:1 #c084fc);
                border: 2px solid #fcd34d;
                transform: scale(1.05);
            }
            QPushButton:pressed {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #4f46e5, stop:0.5 #7c3aed, stop:1 #9333ea);
                border: 2px solid #f59e0b;
            }
        """


class ReadingWidget(QWidget):
    """카드 뽑기 화면"""

    back_to_menu = pyqtSignal()
    save_reading = pyqtSignal(dict)  # 리딩 결과 저장

    def __init__(self, card_manager, sound_manager, parent=None):
        super().__init__(parent)
        self.card_manager = card_manager
        self.sound_manager = sound_manager
        self.spread = None
        self.card_widgets = []
        self.current_card_index = 0
        self.drawn_cards = []

        self.init_ui()

    def init_ui(self):
        """UI 초기화"""
        self.main_layout = QVBoxLayout()
        self.main_layout.setAlignment(Qt.AlignTop)
        self.setLayout(self.main_layout)

    def clear_layout(self, layout):
        """레이아웃의 모든 위젯과 하위 레이아웃 제거"""
        if layout is not None:
            while layout.count():
                child = layout.takeAt(0)
                if child.widget():
                    widget = child.widget()
                    widget.setParent(None)
                    widget.deleteLater()
                elif child.layout():
                    self.clear_layout(child.layout())

    def start_reading(self, spread):
        """
        리딩 시작

        Args:
            spread: Spread 객체
        """
        self.spread = spread
        self.current_card_index = 0
        self.drawn_cards = []
        self.card_manager.reset()

        # 기존 위젯 제거 (더 강력한 방법)
        while self.main_layout.count():
            child = self.main_layout.takeAt(0)
            if child.widget():
                widget = child.widget()
                widget.setParent(None)
                widget.deleteLater()
            elif child.layout():
                # 중첩된 레이아웃도 제거
                self.clear_layout(child.layout())

        # 타이틀
        title = QLabel(f"📖 {spread.name}")
        title.setFont(QFont("Arial", 24, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        self.main_layout.addWidget(title)

        # 스크롤 영역
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)

        # 카드 컨테이너
        card_container = QWidget()
        card_layout = QHBoxLayout()
        card_layout.setSpacing(20)
        card_layout.setAlignment(Qt.AlignLeft)

        # 카드 위젯 생성
        self.card_widgets = []
        for i in range(spread.count):
            card_frame = QFrame()
            card_frame_layout = QVBoxLayout()
            card_frame_layout.setAlignment(Qt.AlignCenter)

            # 카드 위젯
            card_widget = CardWidget(width=300, height=500)
            card_frame_layout.addWidget(card_widget)

            # 위치 의미
            position_label = QLabel(spread.positions[i])
            position_label.setFont(QFont("Arial", 12, QFont.Bold))
            position_label.setAlignment(Qt.AlignCenter)
            position_label.setStyleSheet("color: #fbbf24; margin-top: 10px;")
            position_label.setWordWrap(True)
            position_label.setFixedWidth(300)
            card_frame_layout.addWidget(position_label)

            card_frame.setLayout(card_frame_layout)
            card_layout.addWidget(card_frame)

            self.card_widgets.append(card_widget)

        card_container.setLayout(card_layout)
        scroll.setWidget(card_container)
        self.main_layout.addWidget(scroll)

        # 버튼 레이아웃 (카드 뽑기 + 하단 버튼들)
        buttons_layout = QHBoxLayout()
        buttons_layout.setSpacing(10)

        # 카드 뽑기 버튼
        draw_btn = QPushButton("🎴 카드 뽑기")
        draw_btn.setFont(QFont("Arial", 18, QFont.Bold))
        draw_btn.setFixedSize(400, 80)
        draw_btn.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #6366f1, stop:1 #8b5cf6);
                color: white;
                border: 3px solid #fbbf24;
                border-radius: 15px;
                padding: 10px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #818cf8, stop:1 #a78bfa);
                border: 3px solid #fcd34d;
            }
            QPushButton:pressed {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #4f46e5, stop:1 #7c3aed);
            }
            QPushButton:disabled {
                background: #374151;
                border: 3px solid #6b7280;
                color: #9ca3af;
            }
        """)
        draw_btn.clicked.connect(self.draw_next_card)
        buttons_layout.addWidget(draw_btn)
        self.draw_button = draw_btn

        # 처음으로 버튼
        back_btn = QPushButton("↩ 처음으로")
        back_btn.setFont(QFont("Arial", 13, QFont.Bold))
        back_btn.setFixedSize(140, 60)
        back_btn.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #ef4444, stop:1 #dc2626);
                color: white;
                border: 2px solid #fca5a5;
                border-radius: 12px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #f87171, stop:1 #ef4444);
                border: 2px solid #fecaca;
            }
            QPushButton:pressed {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #dc2626, stop:1 #b91c1c);
            }
        """)
        back_btn.clicked.connect(self.back_to_menu.emit)
        buttons_layout.addWidget(back_btn)

        # 다시 뽑기 버튼
        reset_btn = QPushButton("🔄 다시 뽑기")
        reset_btn.setFont(QFont("Arial", 13, QFont.Bold))
        reset_btn.setFixedSize(140, 60)
        reset_btn.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #f59e0b, stop:1 #d97706);
                color: white;
                border: 2px solid #fcd34d;
                border-radius: 12px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #fbbf24, stop:1 #f59e0b);
                border: 2px solid #fde68a;
            }
            QPushButton:pressed {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #d97706, stop:1 #b45309);
            }
        """)
        reset_btn.clicked.connect(lambda: self.start_reading(self.spread))
        buttons_layout.addWidget(reset_btn)

        # 저장 버튼
        save_btn = QPushButton("💾 저장")
        save_btn.setFont(QFont("Arial", 13, QFont.Bold))
        save_btn.setFixedSize(140, 60)
        save_btn.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #10b981, stop:1 #059669);
                color: white;
                border: 2px solid #6ee7b7;
                border-radius: 12px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #34d399, stop:1 #10b981);
                border: 2px solid #a7f3d0;
            }
            QPushButton:pressed {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #059669, stop:1 #047857);
            }
        """)
        save_btn.clicked.connect(self.save_current_reading)
        buttons_layout.addWidget(save_btn)

        self.main_layout.addLayout(buttons_layout)

        # 뽑은 카드 목록
        self.cards_list_label = QLabel("뽑은 카드: ")
        self.cards_list_label.setFont(QFont("Arial", 13))
        self.cards_list_label.setStyleSheet("color: #a78bfa; margin: 10px; font-weight: 500;")
        self.cards_list_label.setWordWrap(True)
        self.main_layout.addWidget(self.cards_list_label)

    def draw_next_card(self):
        """다음 카드 뽑기"""
        if self.current_card_index >= len(self.card_widgets):
            QMessageBox.information(self, "완료", "모든 카드를 뽑았습니다!")
            self.draw_button.setEnabled(False)
            return

        # 카드 뽑기
        card_path = self.card_manager.draw_card()
        if card_path is None:
            QMessageBox.warning(self, "오류", "더 이상 뽑을 카드가 없습니다!")
            return

        # 사운드 재생
        self.sound_manager.play('draw_card')

        # 카드 표시 (애니메이션)
        card_widget = self.card_widgets[self.current_card_index]
        card_widget.reveal_card(card_path, animated=True)

        # 카드 정보 저장
        card_name = self.card_manager.get_card_name(card_path)
        position = self.spread.positions[self.current_card_index]
        self.drawn_cards.append({
            'position': position,
            'card': card_name,
            'path': str(card_path)
        })

        # 뽑은 카드 목록 업데이트
        cards_text = "뽑은 카드: "
        for card_info in self.drawn_cards:
            cards_text += f"🃏 {card_info['card']} ({card_info['position']})  "
        self.cards_list_label.setText(cards_text)

        # 다음 카드로
        self.current_card_index += 1

        # 버튼 텍스트 업데이트
        remaining = len(self.card_widgets) - self.current_card_index
        if remaining > 0:
            self.draw_button.setText(f"🎴 카드 뽑기 ({remaining}장 남음)")
        else:
            self.draw_button.setText("✅ 완료")
            self.draw_button.setEnabled(False)

    def save_current_reading(self):
        """현재 리딩 저장"""
        if not self.drawn_cards:
            QMessageBox.warning(self, "경고", "뽑은 카드가 없습니다!")
            return

        reading_data = {
            'date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'spread': self.spread.name,
            'cards': self.drawn_cards,
            'note': ''
        }

        self.save_reading.emit(reading_data)
        QMessageBox.information(self, "저장 완료", "리딩이 저장되었습니다!")


class HistoryWidget(QWidget):
    """히스토리 화면"""

    back_to_menu = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.history_data = []
        self.init_ui()

    def init_ui(self):
        """UI 초기화"""
        layout = QVBoxLayout()

        # 타이틀
        title = QLabel("📚 리딩 히스토리")
        title.setFont(QFont("Arial", 24, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        # 히스토리 리스트
        self.list_widget = QListWidget()
        self.list_widget.setFont(QFont("Arial", 12))
        self.list_widget.itemDoubleClicked.connect(self.show_reading_detail)
        layout.addWidget(self.list_widget)

        # 버튼들
        btn_layout = QHBoxLayout()

        back_btn = QPushButton("↩ 처음으로")
        back_btn.clicked.connect(self.back_to_menu.emit)
        btn_layout.addWidget(back_btn)

        clear_btn = QPushButton("🗑 전체 삭제")
        clear_btn.clicked.connect(self.clear_history)
        btn_layout.addWidget(clear_btn)

        layout.addLayout(btn_layout)
        self.setLayout(layout)

    def load_history(self, history_data):
        """히스토리 로드"""
        self.history_data = history_data
        self.list_widget.clear()

        for reading in history_data:
            date = reading.get('date', 'Unknown')
            spread = reading.get('spread', 'Unknown')
            card_count = len(reading.get('cards', []))

            item_text = f"{date} - {spread} ({card_count}장)"
            item = QListWidgetItem(item_text)
            self.list_widget.addItem(item)

    def show_reading_detail(self, item):
        """리딩 상세 보기"""
        index = self.list_widget.row(item)
        if 0 <= index < len(self.history_data):
            reading = self.history_data[index]

            detail_text = f"날짜: {reading['date']}\n"
            detail_text += f"스프레드: {reading['spread']}\n\n"
            detail_text += "뽑은 카드:\n"

            for card_info in reading['cards']:
                detail_text += f"  • {card_info['position']}: {card_info['card']}\n"

            QMessageBox.information(self, "리딩 상세", detail_text)

    def clear_history(self):
        """히스토리 전체 삭제"""
        reply = QMessageBox.question(
            self, '확인',
            '모든 히스토리를 삭제하시겠습니까?',
            QMessageBox.Yes | QMessageBox.No
        )

        if reply == QMessageBox.Yes:
            self.history_data = []
            self.list_widget.clear()
            # 파일도 삭제
            history_file = Path("data/history.json")
            if history_file.exists():
                history_file.unlink()


class TarotApp(QMainWindow):
    """메인 애플리케이션"""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("🎴 타로 카드 리딩")
        self.setGeometry(100, 100, 1400, 800)

        # 다크 테마
        self.set_dark_theme()

        # 매니저 초기화
        try:
            self.card_manager = CardManager()
            self.sound_manager = SoundManager()
        except Exception as e:
            QMessageBox.critical(self, "오류", f"초기화 실패: {e}")
            sys.exit(1)

        # 히스토리 로드
        self.history_file = Path("data/history.json")
        self.history_data = self.load_history()

        # UI 초기화
        self.init_ui()

        # 전체화면 플래그
        self.is_fullscreen = False

    def set_dark_theme(self):
        """다크 테마 설정 - 모던 블루-퍼플 테마"""
        palette = QPalette()
        # 메인 배경: 다크 네이비 블루
        palette.setColor(QPalette.Window, QColor(15, 23, 42))  # Slate 900
        # 텍스트: 밝은 골드/옐로우
        palette.setColor(QPalette.WindowText, QColor(251, 191, 36))  # Amber 400
        # 입력 필드 배경: 더 어두운 블루
        palette.setColor(QPalette.Base, QColor(30, 41, 59))  # Slate 800
        # 대체 배경
        palette.setColor(QPalette.AlternateBase, QColor(51, 65, 85))  # Slate 700
        # 입력 텍스트
        palette.setColor(QPalette.Text, QColor(248, 250, 252))  # Slate 50
        # 버튼 배경: 인디고-퍼플
        palette.setColor(QPalette.Button, QColor(99, 102, 241))  # Indigo 500
        # 버튼 텍스트
        palette.setColor(QPalette.ButtonText, Qt.white)
        # 하이라이트: 바이올렛
        palette.setColor(QPalette.Highlight, QColor(139, 92, 246))  # Violet 500
        palette.setColor(QPalette.HighlightedText, Qt.white)
        self.setPalette(palette)

    def init_ui(self):
        """UI 초기화"""
        # 중앙 위젯
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        layout = QVBoxLayout()
        central_widget.setLayout(layout)

        # 상단 툴바
        toolbar = QHBoxLayout()
        toolbar.addStretch()

        # 음소거 버튼
        mute_btn = QPushButton("🔊")
        mute_btn.setFixedSize(40, 40)
        mute_btn.clicked.connect(self.toggle_mute)
        toolbar.addWidget(mute_btn)
        self.mute_btn = mute_btn

        # 전체화면 버튼
        fullscreen_btn = QPushButton("⛶")
        fullscreen_btn.setFixedSize(40, 40)
        fullscreen_btn.clicked.connect(self.toggle_fullscreen)
        toolbar.addWidget(fullscreen_btn)

        layout.addLayout(toolbar)

        # 스택 위젯 (화면 전환)
        self.stack = QStackedWidget()
        layout.addWidget(self.stack)

        # 메인 메뉴
        self.main_menu = MainMenuWidget()
        self.main_menu.spread_selected.connect(self.start_reading)
        self.main_menu.show_history.connect(self.show_history)
        self.stack.addWidget(self.main_menu)

        # 리딩 화면
        self.reading_widget = ReadingWidget(self.card_manager, self.sound_manager)
        self.reading_widget.back_to_menu.connect(self.show_main_menu)
        self.reading_widget.save_reading.connect(self.save_reading)
        self.stack.addWidget(self.reading_widget)

        # 히스토리 화면
        self.history_widget = HistoryWidget()
        self.history_widget.back_to_menu.connect(self.show_main_menu)
        self.stack.addWidget(self.history_widget)

        # 메인 메뉴 표시
        self.show_main_menu()

    def start_reading(self, spread_type, count):
        """리딩 시작"""
        from spreads import get_spread

        spread = get_spread(spread_type, count)
        if spread:
            self.reading_widget.start_reading(spread)
            self.stack.setCurrentWidget(self.reading_widget)

    def show_main_menu(self):
        """메인 메뉴 표시"""
        self.stack.setCurrentWidget(self.main_menu)

    def show_history(self):
        """히스토리 표시"""
        self.history_widget.load_history(self.history_data)
        self.stack.setCurrentWidget(self.history_widget)

    def save_reading(self, reading_data):
        """리딩 저장"""
        self.history_data.insert(0, reading_data)  # 최신 항목을 맨 위에

        # JSON 파일로 저장
        self.history_file.parent.mkdir(exist_ok=True)
        with open(self.history_file, 'w', encoding='utf-8') as f:
            json.dump(self.history_data, f, ensure_ascii=False, indent=2)

    def load_history(self):
        """히스토리 로드"""
        if self.history_file.exists():
            try:
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"히스토리 로드 실패: {e}")

        return []

    def toggle_mute(self):
        """음소거 토글"""
        is_muted = self.sound_manager.toggle_mute()
        self.mute_btn.setText("🔇" if is_muted else "🔊")

    def toggle_fullscreen(self):
        """전체화면 토글"""
        if self.is_fullscreen:
            self.showNormal()
        else:
            self.showFullScreen()

        self.is_fullscreen = not self.is_fullscreen

    def keyPressEvent(self, event):
        """키보드 이벤트"""
        if event.key() == Qt.Key_F11:
            self.toggle_fullscreen()
        elif event.key() == Qt.Key_Escape and self.is_fullscreen:
            self.toggle_fullscreen()


def main():
    """메인 함수"""
    app = QApplication(sys.argv)

    # 폰트 설정
    app.setFont(QFont("Arial", 10))

    # 메인 윈도우
    window = TarotApp()
    window.show()

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
