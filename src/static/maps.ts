const MAPS: R6Map[] = [
  {
    name: "Bank",
    sites: ["2F CEO", "B Lockers", "1F Open Area", "1F Teller's"],
    floors: [
      {
        floor: "B",
        src: "/map_blueprints/bank/b.png",
        layers: {
          doors: "/map_blueprints/bank/b-doors.svg",
          reinforcements: "/map_blueprints/bank/b-reinforcements.svg",
          windows: "/map_blueprints/bank/b-windows.svg",
        },
      },
      {
        floor: "1F",
        src: "/map_blueprints/bank/1f.png",
        layers: {
          doors: "/map_blueprints/bank/1f-doors.svg",
          reinforcements: "/map_blueprints/bank/1f-reinforcements.svg",
          hatches: "/map_blueprints/bank/1f-hatches.svg",
          windows: "/map_blueprints/bank/1f-windows.svg",
        },
      },
      {
        floor: "2F",
        src: "/map_blueprints/bank/2f.png",
        layers: {
          doors: "/map_blueprints/bank/2f-doors.svg",
          reinforcements: "/map_blueprints/bank/2f-reinforcements.svg",
          hatches: "/map_blueprints/bank/2f-hatches.svg",
          windows: "/map_blueprints/bank/2f-windows.svg",
        },
      },
    ],
  },
  {
    name: "Border",
    sites: ["2F Armory", "1F Bathroom", "1F Workshop"],
    floors: [
      { floor: "1F", src: "/map_blueprints/border/1f.jpg" },
      { floor: "2F", src: "/map_blueprints/border/2f.jpg" },
    ],
  },
  {
    name: "Chalet",
    sites: ["1F Bar", "2F Master", "B Snow", "1F Kitchen"],
    floors: [
      {
        floor: "B",
        src: "/map_blueprints/chalet/b.jpg",
      },
      { floor: "1F", src: "/map_blueprints/chalet/1f.jpg" },
      { floor: "2F", src: "/map_blueprints/chalet/2f.jpg" },
    ],
  },
  {
    name: "Clubhouse",
    sites: ["2F Gym", "B Church", "2F CCTV"],
    floors: [
      {
        floor: "B",
        src: "/map_blueprints/clubhouse/b.png",
        layers: {
          doors: "/map_blueprints/clubhouse/b-doors.svg",
          reinforcements: "/map_blueprints/clubhouse/b-reinforcements.svg",
        },
      },
      {
        floor: "1F",
        src: "/map_blueprints/clubhouse/1f.png",
        layers: {
          doors: "/map_blueprints/clubhouse/1f-doors.svg",
          reinforcements: "/map_blueprints/clubhouse/1f-reinforcements.svg",
          hatches: "/map_blueprints/clubhouse/1f-hatches.svg",
          windows: "/map_blueprints/clubhouse/1f-windows.svg",
        },
      },
      {
        floor: "2F",
        src: "/map_blueprints/clubhouse/2f.png",
        layers: {
          doors: "/map_blueprints/clubhouse/2f-doors.svg",
          reinforcements: "/map_blueprints/clubhouse/2f-reinforcements.svg",
          hatches: "/map_blueprints/clubhouse/2f-hatches.svg",
          windows: "/map_blueprints/clubhouse/2f-windows.svg",
        },
      },
    ],
  },
  {
    name: "Consulate",
    sites: ["2F Consul", "B Garage", "1F Piano", "B/1F Server"],
    floors: [
      {
        floor: "B",
        src: "/map_blueprints/consulate/b.jpg",
        layers: {
          doors: "/map_blueprints/clubhouse/b-doors.svg",
          reinforcements: "/map_blueprints/clubhouse/b-reinforcements.svg",
        },
      },
      {
        floor: "1F",
        src: "/map_blueprints/consulate/1f.jpg",
        layers: {
          doors: "/map_blueprints/clubhouse/1f-doors.svg",
          reinforcements: "/map_blueprints/clubhouse/1f-reinforcements.svg",
          hatches: "/map_blueprints/clubhouse/1f-hatches.svg",
          windows: "/map_blueprints/clubhouse/1f-windows.svg",
        },
      },
      {
        floor: "2F",
        src: "/map_blueprints/consulate/2f.jpg",
        layers: {
          doors: "/map_blueprints/clubhouse/2f-doors.svg",
          reinforcements: "/map_blueprints/clubhouse/2f-reinforcements.svg",
          hatches: "/map_blueprints/clubhouse/2f-hatches.svg",
          windows: "/map_blueprints/clubhouse/2f-windows.svg",
        },
      },
    ],
  },
  {
    name: "Kafe",
    sites: ["3F Cocktail", "1F Kitchen", "2F Reading"],
    floors: [
      { floor: "1F", src: "/map_blueprints/kafe/1f.jpg" },
      { floor: "2F", src: "/map_blueprints/kafe/2f.jpg" },
      { floor: "3F", src: "/map_blueprints/kafe/3f.jpg" },
    ],
  },
  {
    name: "Lair",
    sites: ["2F R6 Room", "1F Bunks", "B Lab"],
    floors: [
      { floor: "B", src: "/map_blueprints/lair/b.png" },
      { floor: "1F", src: "/map_blueprints/lair/1f.png" },
      { floor: "2F", src: "/map_blueprints/lair/2f.png" },
    ],
  },
  {
    name: "Nighthaven",
    sites: ["2F Server", "B Tank", "1F Storage", "1F Kitchen"],
    floors: [
      { floor: "B", src: "/map_blueprints/nighthaven/b.jpg" },
      { floor: "1F", src: "/map_blueprints/nighthaven/1f.jpg" },
      { floor: "2F", src: "/map_blueprints/nighthaven/2f.jpg" },
    ],
  },
  {
    name: "Skyscraper",
    sites: ["2F Tea", "2F Exhibition", "1F Kitchen"],
    floors: [
      { floor: "1F", src: "/map_blueprints/skyscraper/1f.jpg" },
      { floor: "2F", src: "/map_blueprints/skyscraper/2f.jpg" },
    ],
  },
];

export default MAPS;
