import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'theme.dart';
import 'strings.dart';
import 'services/footprint_store.dart';
import 'screens/home_screen.dart';
import 'screens/calculator_screen.dart';
import 'screens/complaints_screen.dart';
import 'screens/local_projects_screen.dart';
import 'screens/more_screen.dart';

void main() {
  runApp(const MoEcoApp());
}

class MoEcoApp extends StatefulWidget {
  const MoEcoApp({super.key});

  @override
  State<MoEcoApp> createState() => _MoEcoAppState();
}

class _MoEcoAppState extends State<MoEcoApp> {
  FootprintStore? _store;
  bool _arabic = true;

  @override
  void initState() {
    super.initState();
    FootprintStore.load().then((store) {
      setState(() => _store = store);
    });
  }

  void _refresh() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final s = S(_arabic);
    return MaterialApp(
      title: s.appName,
      debugShowCheckedModeBanner: false,
      theme: MoEcoTheme.light,
      locale: Locale(_arabic ? 'ar' : 'en'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: _store == null
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : _Shell(
              s: s,
              store: _store!,
              onChanged: _refresh,
              onToggleLanguage: () => setState(() => _arabic = !_arabic),
            ),
    );
  }
}

class _Shell extends StatefulWidget {
  final S s;
  final FootprintStore store;
  final VoidCallback onChanged;
  final VoidCallback onToggleLanguage;
  const _Shell({
    required this.s,
    required this.store,
    required this.onChanged,
    required this.onToggleLanguage,
  });

  @override
  State<_Shell> createState() => _ShellState();
}

class _ShellState extends State<_Shell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final screens = [
      HomeScreen(s: s, store: widget.store, onChanged: widget.onChanged),
      CalculatorScreen(s: s),
      ComplaintsScreen(s: s, store: widget.store, onChanged: widget.onChanged),
      LocalProjectsScreen(s: s),
      MoreScreen(
        s: s,
        store: widget.store,
        onChanged: widget.onChanged,
        onToggleLanguage: widget.onToggleLanguage,
      ),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.eco, size: 22),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.appName,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                Text(s.appTag, style: const TextStyle(fontSize: 11, color: Colors.white70)),
              ],
            ),
          ],
        ),
      ),
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Colors.white,
        indicatorColor: MoEcoTheme.primary.withOpacity(0.12),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), label: s.navHome),
          NavigationDestination(icon: const Icon(Icons.bolt_outlined), label: s.navCalc),
          NavigationDestination(icon: const Icon(Icons.assignment_outlined), label: s.navComplaints),
          NavigationDestination(icon: const Icon(Icons.location_city_outlined), label: s.navProjects),
          NavigationDestination(icon: const Icon(Icons.menu), label: s.navMore),
        ],
      ),
    );
  }
}
