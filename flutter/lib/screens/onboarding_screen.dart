import 'package:flutter/material.dart';
import '../theme.dart';
import '../strings.dart';

/// First-run onboarding: three honest slides about what the app does.
/// Shown once; completion is stored on the device.
class OnboardingScreen extends StatefulWidget {
  final S s;
  final VoidCallback onDone;
  const OnboardingScreen({super.key, required this.s, required this.onDone});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final slides = <_SlideData>[
      _SlideData(
        icon: Icons.eco_outlined,
        title: s.onbTitle1,
        body: s.onbBody1,
      ),
      _SlideData(
        icon: Icons.assignment_outlined,
        title: s.onbTitle2,
        body: s.onbBody2,
      ),
      _SlideData(
        icon: Icons.lock_outline,
        title: s.onbTitle3,
        body: s.onbBody3,
      ),
    ];
    final isLast = _page == slides.length - 1;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: AlignmentDirectional.topEnd,
              child: TextButton(
                onPressed: widget.onDone,
                child: Text(s.onbSkip,
                    style: const TextStyle(color: MoEcoTheme.textMuted)),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: slides.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (ctx, i) {
                  final sl = slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(36),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: Icon(sl.icon, size: 56, color: MoEcoTheme.primary),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          sl.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: MoEcoTheme.textMain,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          sl.body,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14.5,
                            height: 1.7,
                            color: MoEcoTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                slides.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _page == i ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _page == i
                        ? MoEcoTheme.primary
                        : MoEcoTheme.cardBorder,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: ElevatedButton(
                onPressed: () {
                  if (isLast) {
                    widget.onDone();
                  } else {
                    _controller.nextPage(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOut,
                    );
                  }
                },
                child: Text(isLast ? s.onbStart : s.onbNext),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SlideData {
  final IconData icon;
  final String title;
  final String body;
  const _SlideData({required this.icon, required this.title, required this.body});
}
