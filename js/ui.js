window.IC = window.IC || {};

(function (IC) {
  IC.icon = function (name) {
    var paths = {
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/>',
      briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
      users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.2"/><path d="M21 20c0-2.2-1.6-3.8-4-4.2"/>',
      bell: '<path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
      settings: '<path d="M8.35 5.68 9.77 2.2 14.23 2.2 15.65 5.68 19.4 5.15 21.5 8.8 19.2 12 21.5 15.2 19.4 18.85 15.65 18.32 14.23 21.8 9.77 21.8 8.35 18.32 4.6 18.85 2.5 15.2 4.8 12 2.5 8.8 4.6 5.15Z"/><circle cx="12" cy="12" r="2.7"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>',
      arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
      back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
      share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>',
      trash: '<path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"/>',
      userplus: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M19 8v6M16 11h6"/>',
      pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      box: '<path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5Z"/><path d="M3 8.5V16l9 4.5 9-4.5V8.5"/><path d="M12 13v7.5"/>',
      hammer: '<path d="M15 3.5 20.5 9 18 11.5 12.5 6Z"/><path d="M13.2 8.8 5 17l2 2 8.2-8.2"/><path d="M4 20h6"/>',
      hammerClassic: '<path d="M15 3.5 20.5 9 18 11.5 12.5 6Z"/><path d="M13.2 8.8 5 17l2 2 8.2-8.2"/><path d="M4 20h6"/>',
      ladder: '<path d="M3.73 16.45 16.45 3.73"/><path d="M7.55 20.27 20.27 7.55"/><path d="M5.76 14.42 9.58 18.24"/><path d="M8.65 11.53 12.47 15.35"/><path d="M11.53 8.65 15.35 12.47"/><path d="M14.42 5.76 18.24 9.58"/>',
      finance: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h5"/>',
      pin: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
      nav: '<path d="m4 12 16-8-8 16-1.4-6.6Z"/>',
      rotate: '<path d="M8 8.2a5.2 5.2 0 0 1 7.6-.4"/><path d="M14.2 4.8l1.6 3.2-3.2.4"/><path d="M16 15.8a5.2 5.2 0 0 1-7.6.4"/><path d="M9.8 19.2 8.2 16l3.2-.4"/>',
    };
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || "") + "</svg>";
  };

  IC.badge = function (status) {
    var tone = IC.statusTone(status);
    return '<span class="badge tone-' + tone + '">' + IC.esc(status) + "</span>";
  };
