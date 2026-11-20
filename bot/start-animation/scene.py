"""GlassWallet /start animation — modeled on the "Solana Battle" reference.
Square 720x720, 30fps, ~6.7s. Flat 2D vector style, bright blue gradient bg.

Scene 1 (0-2s):   "GlassWallet is live" fades in at top; gold BNB coin spins
                   in the center (fake 3D spin via horizontal squash);
                   white 4-point stars twinkle around it.
Scene 2 (2-4s):   coin morphs into white smart glasses; text
                   "Check balance. Send BNB." fades in at the bottom.
Scene 3 (4-6s):   "Wallet on your glasses." fades in at the top
                   (title fades out); glasses stay centered; everything
                   fades out at the end.

All text in English. No XP, rewards or prize pool mentioned.
"""
from manim import *
import numpy as np

config.pixel_width = 720
config.pixel_height = 720
config.frame_width = 7.2
config.frame_height = 7.2

BG = "/home/hatch/workspace/even-realities-glasswallet/bot/start-animation/bg.png"
BNB_COIN = "/home/hatch/workspace/even-realities-glasswallet/bot/start-animation/bnb-coin.png"

GOLD = "#F0B90B"
GOLD_RING = "#C98A04"
GOLD_DARK = "#7A5C00"
GOLD_DEEP = "#D99A06"
LENS_BLUE = "#A9C6F7"

COIN_POS = np.array([0.0, 0.3, 0.0])
TITLE_Y = 2.85
BOTTOM_Y = -2.85


def sparkle(size):
    """White 4-point star (like the reference's twinkling sparkles)."""
    pts = []
    for i in range(8):
        ang = i * np.pi / 4
        r = size if i % 2 == 0 else size * 0.22
        pts.append([r * np.cos(ang), r * np.sin(ang), 0])
    return Polygon(*pts, fill_color=WHITE, fill_opacity=1, stroke_width=0)


def coin_group():
    """The real BNB coin logo, extracted from the official BNB Chain logo."""
    img = ImageMobject(BNB_COIN)
    img.height = 3.0
    return Group(img)


def glasses_group():
    """White smart glasses, front view, flat 2D (like the GlassWallet logo)."""
    def frame(x):
        outer = RoundedRectangle(corner_radius=0.30, width=1.85, height=1.6,
                                 fill_color=WHITE, fill_opacity=1, stroke_width=0)
        outer.move_to([x, 0, 0])
        lens = RoundedRectangle(corner_radius=0.22, width=1.45, height=1.2,
                                fill_color=LENS_BLUE, fill_opacity=1, stroke_width=0)
        lens.move_to([x, 0, 0])
        return VGroup(outer, lens)

    left = frame(-1.15)
    right = frame(1.15)
    bridge = Rectangle(width=0.7, height=0.28, fill_color=WHITE,
                       fill_opacity=1, stroke_width=0)
    bridge.move_to([0, 0.55, 0])
    temple_l = Rectangle(width=0.75, height=0.26, fill_color=WHITE,
                         fill_opacity=1, stroke_width=0)
    temple_l.move_to([-2.55, 0.32, 0])
    temple_r = Rectangle(width=0.75, height=0.26, fill_color=WHITE,
                         fill_opacity=1, stroke_width=0)
    temple_r.move_to([2.55, 0.32, 0])
    # small real BNB coin at the bridge, like the logo
    mini = ImageMobject(BNB_COIN)
    mini.height = 0.68
    mini.move_to([0, 0.55, 0])
    return Group(left, right, bridge, temple_l, temple_r, mini)


class GlassWalletStart(Scene):
    def construct(self):
        bg = ImageMobject(BG)
        bg.height = 7.2
        bg.move_to(ORIGIN)
        self.add(bg)

        title = Text("GlassWallet is live", font="Inter", weight="BOLD",
                     font_size=40, color=WHITE)
        title.move_to([0, TITLE_Y, 0])

        coin_base = coin_group()
        coin_base.move_to(COIN_POS)
        coin = coin_base.copy()

        # twinkling stars around the coin
        star_specs = [
            (-2.7, 1.2, 0.16, 0.0), (2.8, 1.5, 0.13, 1.1),
            (-2.9, -0.9, 0.20, 2.0), (2.7, -1.2, 0.16, 0.6),
            (1.8, 2.3, 0.11, 1.6), (-2.0, 2.2, 0.13, 2.6),
            (0.6, -2.4, 0.12, 0.9), (-0.9, -2.5, 0.10, 2.2),
        ]
        stars = VGroup()
        for x, y, size, phase in star_specs:
            st = sparkle(size)
            st.move_to([x, y, 0])
            st._tw = phase

            def make_upd(ph):
                def upd(mob, dt):
                    mob._tw += dt
                    v = 0.5 + 0.5 * np.sin(mob._tw * 2.2 + ph)
                    mob.set_opacity(0.1 + 0.9 * v)
                return upd

            st.add_updater(make_upd(phase))
            stars.add(st)
        self.add(stars)

        # ---- Scene 1: title + coin fade in, coin spins ----
        self.play(FadeIn(title, run_time=0.6),
                  FadeIn(coin, run_time=0.6), run_time=0.6)

        def spin_func(mob, alpha):
            # fake 3D spin: squash the coin horizontally, idempotently
            # (Group.become does not work with an ImageMobject inside)
            s = max(abs(np.cos(alpha * np.pi * 3)), 0.06)  # 1.5 spins
            mob.stretch_to_fit_width(3.0 * s)
            mob.move_to(COIN_POS)

        self.play(UpdateFromAlphaFunc(coin, spin_func), run_time=1.5)

        # ---- Scene 2: coin shrinks away, glasses grow in (clean morph) ----
        glasses = glasses_group()
        glasses.move_to(COIN_POS)
        self.play(coin.animate.scale(0.05), run_time=0.3)
        self.play(GrowFromCenter(glasses), run_time=0.5)
        self.remove(coin)

        bottom = Text("Check balance. Send BNB.", font="Inter", weight="BOLD",
                      font_size=30, color=WHITE)
        bottom.move_to([0, BOTTOM_Y, 0])
        self.play(FadeIn(bottom, run_time=0.4))
        self.wait(1.2)

        # ---- Scene 3: closing line at the top ----
        top3 = Text("Wallet on your glasses.", font="Inter", weight="BOLD",
                    font_size=40, color=WHITE)
        top3.move_to([0, TITLE_Y, 0])
        self.play(FadeOut(title, run_time=0.3),
                  FadeIn(top3, run_time=0.5))
        self.wait(1.4)

        # ---- fade everything out ----
        for st in stars:
            st.clear_updaters()
        self.play(FadeOut(bg), FadeOut(glasses), FadeOut(bottom),
                  FadeOut(top3), FadeOut(stars), run_time=0.5)
