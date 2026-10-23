// Tanzania Administrative Divisions & Postcodes (NAPA / TCRA Official System)
// Source: https://napa.mawasiliano.go.tz/find-post-code

export interface DistrictInfo {
    name: string;
    swahiliName?: string;
    wards?: string[];
}

export interface RegionInfo {
    name: string;
    swahiliName: string;
    zone?: string;
    districts: DistrictInfo[];
}

export const TANZANIA_REGIONS: RegionInfo[] = [
    {
        name: 'Dar es Salaam',
        swahiliName: 'Dar es Salaam',
        zone: 'Coastal',
        districts: [
            {
                name: 'Kinondoni',
                wards: [
                    'Masaki',
                    'Oysterbay',
                    'Mikocheni',
                    'Msasani',
                    'Kawe',
                    'Mbezi Beach',
                    'Kijitonyama',
                    'Mwenge',
                    'Makumbusho',
                    'Sinza',
                    'Kinondoni',
                    'Magomeni',
                    'Kunduchi',
                    'Tegeta',
                    'Bunju',
                    'Wazo',
                    'Tandale',
                    'Hananasif',
                    'Kigogo',
                    'Ndugumbi',
                ],
            },
            {
                name: 'Ilala',
                wards: [
                    'Upanga Mashariki',
                    'Upanga Magharibi',
                    'Kariakoo',
                    'Kisutu',
                    'Kivukoni',
                    'City Centre',
                    'Jangwani',
                    'Mchafukoge',
                    'Gerezani',
                    'Tabata',
                    'Segerea',
                    'Kinyerezi',
                    'Buguruni',
                    'Vingunguti',
                    'Ukonga',
                    'Gongolamboto',
                    'Chanika',
                    'Pugu',
                    'Kitunda',
                    'Ilala Boma',
                ],
            },
            {
                name: 'Temeke',
                wards: [
                    'Temeke',
                    'Kurasini',
                    'Chang\'ombe',
                    'Keko',
                    'Mbagala',
                    'Mbagala Kuu',
                    'Chamazi',
                    'Tandika',
                    'Sandali',
                    'Yombo Vituka',
                    'Toangoma',
                    'Buza',
                    'Charambe',
                    'Kiburugutu',
                    'Azimio',
                    'Kijichi',
                ],
            },
            {
                name: 'Ubungo',
                wards: [
                    'Ubungo',
                    'Sinza',
                    'Kimara',
                    'Mbezi',
                    'Goba',
                    'Mabibo',
                    'Manzese',
                    'Kibamba',
                    'Saranga',
                    'Makurumla',
                    'Msigani',
                    'Kwembe',
                ],
            },
            {
                name: 'Kigamboni',
                wards: [
                    'Kigamboni',
                    'Kivukoni Ferry',
                    'Tungi',
                    'Vijibweni',
                    'Kibada',
                    'Somangila',
                    'Mjimwema',
                    'Kisarawe II',
                    'Pembamnazi',
                    'Kimbiji',
                    'Gezaulole',
                    'Buyuni',
                ],
            },
        ],
    },
    {
        name: 'Arusha',
        swahiliName: 'Arusha',
        zone: 'Northern',
        districts: [
            {
                name: 'Arusha City',
                wards: ['Sekei', 'Kaloleni', 'Themi', 'Kimandolu', 'Sakina', 'Njiro', 'Oloirien', 'Baraa', 'Sombetini', 'Unga Ltd'],
            },
            { name: 'Arumeru', wards: ['Usa River', 'Majengo', 'Poli', 'Nkoaranga'] },
            { name: 'Meru', wards: ['King\'ori', 'Songoro', 'Leguruki'] },
            { name: 'Karatu', wards: ['Karatu Mjini', 'Rhotia', 'Endamarariek'] },
            { name: 'Monduli', wards: ['Monduli Mjini', 'Engutoto', 'Lolkisale'] },
            { name: 'Longido', wards: ['Longido Mjini', 'Namanga', 'Engarenaibor'] },
            { name: 'Ngorongoro', wards: ['Loliondo', 'Waso', 'Nainokanoka'] },
        ],
    },
    {
        name: 'Dodoma',
        swahiliName: 'Dodoma',
        zone: 'Central',
        districts: [
            {
                name: 'Dodoma City',
                wards: ['Kisasa', 'Miyuji', 'Area C', 'Area D', 'Makole', 'Kilimani', 'Tambukareli', 'Nzuguni', 'Mtumba', 'Hazina', 'Ipagala'],
            },
            { name: 'Bahi', wards: ['Bahi Mjini', 'Mundemu', 'Kigwe'] },
            { name: 'Chamwino', wards: ['Chamwino Mjini', 'Buigiri', 'Chilonwa'] },
            { name: 'Chemba', wards: ['Chemba Mjini', 'Farkwa', 'Kwadelo'] },
            { name: 'Kondoa', wards: ['Kondoa Mjini', 'Kolo', 'Haubi'] },
            { name: 'Kongwa', wards: ['Kongwa Mjini', 'Kibaigwa', 'Mlali'] },
            { name: 'Mpwapwa', wards: ['Mpwapwa Mjini', 'Rudi', 'Gulwe'] },
        ],
    },
    {
        name: 'Zanzibar (Mjini Magharibi)',
        swahiliName: 'Zanzibar (Mjini Magharibi)',
        zone: 'Zanzibar',
        districts: [
            {
                name: 'Mjini',
                wards: ['Stone Town', 'Shangani', 'Forodhani', 'Malindi', 'Mkunazini', 'Kikwajuni', 'Michenzani'],
            },
            {
                name: 'Magharibi A',
                wards: ['Mbweni', 'Chukwani', 'Kiembe Samaki', 'Mwanakwerekwe'],
            },
            {
                name: 'Magharibi B',
                wards: ['Fumba', 'Bweleo', 'Dimani', 'Kombeni'],
            },
            {
                name: 'Kaskazini A (Nungwi/Kendwa)',
                wards: ['Nungwi', 'Kendwa', 'Matemwe', 'Kinyasini'],
            },
            {
                name: 'Kusini (Paje/Jambiani)',
                wards: ['Paje', 'Jambiani', 'Kizimkazi', 'Makunduchi', 'Bwejuu'],
            },
        ],
    },
    {
        name: 'Kilimanjaro',
        swahiliName: 'Kilimanjaro',
        zone: 'Northern',
        districts: [
            {
                name: 'Moshi Urban',
                wards: ['Shanty Town', 'Soweto', 'Rau', 'Pasua', 'Kiboriloni', 'Mawenzi', 'Kiusa', 'Bondeni'],
            },
            { name: 'Moshi Rural', wards: ['Kibosho', 'Kirua Vunjo', 'Marangu', 'Machame'] },
            { name: 'Hai', wards: ['Boma la Ng\'ombe', 'Machame Kaskazini', 'Weruweru'] },
            { name: 'Siha', wards: ['Sanya Juu', 'Ngarenairobi'] },
            { name: 'Rombo', wards: ['Mkuu', 'Tarakea', 'Useri', 'Mashati'] },
            { name: 'Mwanga', wards: ['Mwanga Mjini', 'Usangi', 'Lembeni'] },
            { name: 'Same', wards: ['Same Mjini', 'Hedaru', 'Makanya'] },
        ],
    },
    {
        name: 'Mwanza',
        swahiliName: 'Mwanza',
        zone: 'Lake',
        districts: [
            {
                name: 'Nyamagana',
                wards: ['Capri Point', 'Isamilo', 'Nyakato', 'Mirongo', 'Pamba', 'Butimba', 'Mkolani', 'Igoma'],
            },
            {
                name: 'Ilemela',
                wards: ['Pasiansi', 'Bwiru', 'Kirumba', 'Nyakato', 'Nyamanoro', 'Kitangiri', 'Kawekamo', 'Buswelu'],
            },
            { name: 'Magu', wards: ['Magu Mjini', 'Kisesa', 'Nyanguge'] },
            { name: 'Sengerema', wards: ['Sengerema Mjini', 'Katunguru', 'Nyampande'] },
            { name: 'Misungwi', wards: ['Misungwi Mjini', 'Usagara', 'Fella'] },
            { name: 'Kwimba', wards: ['Ngudu', 'Nyambiti', 'Malya'] },
            { name: 'Ukerewe', wards: ['Nansio Mjini', 'Kagunguli', 'Bwisya'] },
        ],
    },
    {
        name: 'Pwani',
        swahiliName: 'Pwani',
        zone: 'Coastal',
        districts: [
            {
                name: 'Bagamoyo',
                wards: ['Bagamoyo Mjini', 'Kaole', 'Dunda', 'Kiromo', 'Fukayosi', 'Zinga'],
            },
            {
                name: 'Kibaha Town',
                wards: ['Maili Moja', 'Tumbi', 'Kibaha', 'Visiga', 'Picha ya Ndege', 'Kongowe'],
            },
            { name: 'Kibaha Rural', wards: ['Mlandizi', 'Ruvu', 'Soga'] },
            { name: 'Kisarawe', wards: ['Kisarawe Mjini', 'Kazimzumbwi', 'Masanganya'] },
            { name: 'Mkuranga', wards: ['Mkuranga Mjini', 'Kisiju', 'Shungubweni'] },
            { name: 'Mafia', wards: ['Kilindoni', 'Baleni', 'Utende'] },
            { name: 'Rufiji', wards: ['Utete', 'Ikwiriri', 'Bungu'] },
            { name: 'Kibiti', wards: ['Kibiti Mjini', 'Bungu', 'Dimani'] },
        ],
    },
    {
        name: 'Tanga',
        swahiliName: 'Tanga',
        zone: 'Coastal',
        districts: [
            {
                name: 'Tanga City',
                wards: ['Raskazone', 'Usagara', 'Chumbageni', 'Majengo', 'Ngamiani', 'Makorora', 'Mwanzange'],
            },
            { name: 'Pangani', wards: ['Pangani Mjini', 'Kipumbwi', 'Mwera', 'Mkwaja'] },
            { name: 'Muheza', wards: ['Muheza Mjini', 'Amani', 'Tongwe'] },
            { name: 'Lushoto', wards: ['Lushoto Mjini', 'Soni', 'Mlalo', 'Mombo'] },
            { name: 'Korogwe Town', wards: ['Korogwe Mjini', 'Old Korogwe', 'Kilole'] },
            { name: 'Handeni Town', wards: ['Chanika', 'Kiva', 'Mbagven'] },
        ],
    },
    {
        name: 'Morogoro',
        swahiliName: 'Morogoro',
        zone: 'Eastern',
        districts: [
            {
                name: 'Morogoro Urban',
                wards: ['Boma', 'Forest Hill', 'Sultani Area', 'Bigwa', 'Mazimbu', 'Kihonda', 'Sabasaba', 'Mwembesongo'],
            },
            { name: 'Morogoro Rural', wards: ['Mkuyuni', 'Matombo', 'Mngazi'] },
            { name: 'Kilombero', wards: ['Ifakara', 'Mang\'ula', 'Kidatu'] },
            { name: 'Kilosa', wards: ['Kilosa Mjini', 'Kimamba', 'Dumila'] },
            { name: 'Mvomero', wards: ['Dakawa', 'Doma', 'Turiani'] },
            { name: 'Gairo', wards: ['Gairo Mjini', 'Chagongwe'] },
            { name: 'Ulanga', wards: ['Mahenge Mjini', 'Vigoi'] },
            { name: 'Malinyi', wards: ['Malinyi Mjini', 'Ngoheranga'] },
        ],
    },
    {
        name: 'Mbeya',
        swahiliName: 'Mbeya',
        zone: 'Southern Highlands',
        districts: [
            {
                name: 'Mbeya City',
                wards: ['Forest', 'Iyunga', 'Sisimba', 'Mbalizi Road', 'Mwanjelwa', 'Ruanda', 'Ilomba'],
            },
            { name: 'Rungwe', wards: ['Tukuyu Mjini', 'Kandete', 'Kyimo'] },
            { name: 'Kyela', wards: ['Kyela Mjini', 'Matema', 'Ngonga'] },
            { name: 'Chunya', wards: ['Chunya Mjini', 'Makongorosi'] },
            { name: 'Mbarali', wards: ['Rujewa', 'Ubaruku', 'Madibira'] },
            { name: 'Busokelo', wards: ['Luteba', 'Kisegese'] },
        ],
    },
    {
        name: 'Iringa',
        swahiliName: 'Iringa',
        zone: 'Southern Highlands',
        districts: [
            { name: 'Iringa Municipal', wards: ['Gangilonga', 'Kihesa', 'Mkwawa', 'Mtwivila', 'Ilala', 'Wilolesi'] },
            { name: 'Kilolo', wards: ['Ilula', 'Kilolo Mjini', 'Udzungwa'] },
            { name: 'Mufindi', wards: ['Kasanga', 'Kibao', 'Sao Hill'] },
            { name: 'Mafinga Town', wards: ['Boma', 'Kinyanambo', 'Wambi'] },
        ],
    },
    {
        name: 'Geita',
        swahiliName: 'Geita',
        zone: 'Lake',
        districts: [
            { name: 'Geita', wards: ['Geita Mjini', 'Katoro', 'Buseresere', 'Nzera'] },
            { name: 'Chato', wards: ['Chato Mjini', 'Bwanga', 'Muganza'] },
            { name: 'Bukombe', wards: ['Ushirombo', 'Uyovu'] },
            { name: 'Mbogwe', wards: ['Masumbwe', 'Mbogwe'] },
            { name: 'Nyang\'hwale', wards: ['Kharumwa', 'Nyugwa'] },
        ],
    },
    {
        name: 'Kagera',
        swahiliName: 'Kagera',
        zone: 'Lake',
        districts: [
            { name: 'Bukoba Municipal', wards: ['Bakoba', 'Kashai', 'Hamugembe', 'Rwamishenye'] },
            { name: 'Muleba', wards: ['Muleba Mjini', 'Nshamba', 'Kamachumu'] },
            { name: 'Karagwe', wards: ['Kayanga', 'Omurushaka'] },
            { name: 'Ngara', wards: ['Ngara Mjini', 'Rulenge', 'Benaco'] },
            { name: 'Biharamulo', wards: ['Biharamulo Mjini', 'Nyakahura'] },
            { name: 'Missenyi', wards: ['Kyaka', 'Mutukula', 'Bunazi'] },
            { name: 'Kyerwa', wards: ['Rubingazi', 'Nkwenda'] },
        ],
    },
    {
        name: 'Kigoma',
        swahiliName: 'Kigoma',
        zone: 'Western',
        districts: [
            { name: 'Kigoma-Ujiji', wards: ['Ujiji', 'Mwanga', 'Kigoma Mjini', 'Gungu', 'Bangwe'] },
            { name: 'Kasulu Town', wards: ['Murubona', 'Kumnyika', 'Kasulu Mjini'] },
            { name: 'Kibondo', wards: ['Kibondo Mjini', 'Mabamba'] },
            { name: 'Buhigwe', wards: ['Buhigwe Mjini', 'Muyama'] },
            { name: 'Uvinza', wards: ['Uvinza Mjini', 'Nguruka'] },
            { name: 'Kakonko', wards: ['Kakonko Mjini', 'Gwarama'] },
        ],
    },
    {
        name: 'Manyara',
        swahiliName: 'Manyara',
        zone: 'Northern',
        districts: [
            { name: 'Babati Town', wards: ['Babati Mjini', 'Maisaka', 'Bonga'] },
            { name: 'Hanang', wards: ['Katesh', 'Basotu'] },
            { name: 'Mbulu', wards: ['Mbulu Mjini', 'Dongobesh'] },
            { name: 'Simanjiro', wards: ['Mirerani', 'Orkesumet'] },
            { name: 'Kiteto', wards: ['Kibaya', 'Dosidosi'] },
        ],
    },
    {
        name: 'Mara',
        swahiliName: 'Mara',
        zone: 'Lake',
        districts: [
            { name: 'Musoma Municipal', wards: ['Mwigobero', 'Kamunyonge', 'Nyasho', 'Bweri'] },
            { name: 'Tarime', wards: ['Tarime Mjini', 'Sirari', 'Nyamwaga'] },
            { name: 'Serengeti', wards: ['Mugumu', 'Robanda'] },
            { name: 'Bunda', wards: ['Bunda Mjini', 'Guta'] },
            { name: 'Rorya', wards: ['Ingri', 'Shirati'] },
            { name: 'Butiama', wards: ['Butiama Mjini', 'Kiabakari'] },
        ],
    },
    {
        name: 'Mtwara',
        swahiliName: 'Mtwara',
        zone: 'Southern',
        districts: [
            { name: 'Mtwara Municipal', wards: ['Shangani', 'Rahaleo', 'Chikongola', 'Vigaeni', 'Mitengo'] },
            { name: 'Masasi Town', wards: ['Mwenge Mtapika', 'Jida', 'Nyasa'] },
            { name: 'Newala', wards: ['Newala Mjini', 'Luchingu'] },
            { name: 'Tandahimba', wards: ['Tandahimba Mjini', 'Mahuta'] },
            { name: 'Nanyumbu', wards: ['Mangaka', 'Nangomba'] },
        ],
    },
    {
        name: 'Njombe',
        swahiliName: 'Njombe',
        zone: 'Southern Highlands',
        districts: [
            { name: 'Njombe Town', wards: ['Njombe Mjini', 'Ramadhani', 'Makambako Road'] },
            { name: 'Makambako', wards: ['Makambako Mjini', 'Mwembetogwa'] },
            { name: 'Makete', wards: ['Iwawa', 'Tandala'] },
            { name: 'Ludewa', wards: ['Ludewa Mjini', 'Mlangali'] },
            { name: 'Wanging\'ombe', wards: ['Ilembula', 'Wanging\'ombe'] },
        ],
    },
    {
        name: 'Rukwa',
        swahiliName: 'Rukwa',
        zone: 'Southern Highlands',
        districts: [
            { name: 'Sumbawanga Municipal', wards: ['Katandala', 'Mazwi', 'Chanji', 'Old Sumbawanga'] },
            { name: 'Kalambo', wards: ['Matai', 'Kasanga'] },
            { name: 'Nkasi', wards: ['Namanyere', 'Kirando'] },
        ],
    },
    {
        name: 'Ruvuma',
        swahiliName: 'Ruvuma',
        zone: 'Southern',
        districts: [
            { name: 'Songea Municipal', wards: ['Bombambili', 'Matarawe', 'Lizaboni', 'Ruvuma'] },
            { name: 'Mbinga', wards: ['Mbinga Mjini', 'Mbamba Bay'] },
            { name: 'Tunduru', wards: ['Tunduru Mjini', 'Nakasunguti'] },
            { name: 'Namtumbo', wards: ['Namtumbo Mjini', 'Rwinga'] },
            { name: 'Nyasa', wards: ['Mbamba Bay', 'Liuli'] },
        ],
    },
    {
        name: 'Shinyanga',
        swahiliName: 'Shinyanga',
        zone: 'Lake',
        districts: [
            { name: 'Shinyanga Municipal', wards: ['Kambarage', 'Ibadakuli', 'Ngokolo', 'Lubaga'] },
            { name: 'Kahama Town', wards: ['Kahama Mjini', 'Nyasubi', 'Majengo', 'Malunga'] },
            { name: 'Kishapu', wards: ['Kishapu Mjini', 'Mwadui'] },
        ],
    },
    {
        name: 'Simiyu',
        swahiliName: 'Simiyu',
        zone: 'Lake',
        districts: [
            { name: 'Bariadi', wards: ['Bariadi Mjini', 'Somanda', 'Malambo'] },
            { name: 'Busega', wards: ['Nyashimo', 'Lamadi'] },
            { name: 'Maswa', wards: ['Maswa Mjini', 'Binza'] },
            { name: 'Itilima', wards: ['Lagangabilili', 'Nkoma'] },
            { name: 'Meatu', wards: ['Mwanhuzi', 'Kisesa'] },
        ],
    },
    {
        name: 'Singida',
        swahiliName: 'Singida',
        zone: 'Central',
        districts: [
            { name: 'Singida Municipal', wards: ['Mingi', 'Kindai', 'Utemini', 'Ipembe'] },
            { name: 'Manyoni', wards: ['Manyoni Mjini', 'Itigi'] },
            { name: 'Iramba', wards: ['Kiomboi', 'Shelui'] },
            { name: 'Ikungi', wards: ['Ikungi Mjini', 'Puma'] },
            { name: 'Mkalama', wards: ['Nduguti', 'Gumanga'] },
        ],
    },
    {
        name: 'Songwe',
        swahiliName: 'Songwe',
        zone: 'Southern Highlands',
        districts: [
            { name: 'Tunduma Town', wards: ['Tunduma Mjini', 'Chapwa', 'Kalasanga'] },
            { name: 'Mbozi', wards: ['Vwawa', 'Mlowo'] },
            { name: 'Momba', wards: ['Chitete', 'Kamsamba'] },
            { name: 'Ileje', wards: ['Itumba', 'Isongole'] },
            { name: 'Songwe', wards: ['Mkwajuni', 'Gua'] },
        ],
    },
    {
        name: 'Tabora',
        swahiliName: 'Tabora',
        zone: 'Western',
        districts: [
            { name: 'Tabora Municipal', wards: ['Ipuli', 'Chemchem', 'Kiloleni', 'Mbugani', 'Gongoni'] },
            { name: 'Nzega Town', wards: ['Nzega Mjini', 'Uchama'] },
            { name: 'Igunga', wards: ['Igunga Mjini', 'Simbo'] },
            { name: 'Urambo', wards: ['Urambo Mjini', 'Kiloleni'] },
            { name: 'Sikonge', wards: ['Sikonge Mjini', 'Tutuo'] },
            { name: 'Kaliua', wards: ['Kaliua Mjini', 'Usinge'] },
            { name: 'Uyui', wards: ['Isikizya', 'Loya'] },
        ],
    },
    {
        name: 'Katavi',
        swahiliName: 'Katavi',
        zone: 'Western',
        districts: [
            { name: 'Mpanda Municipal', wards: ['Mpanda Mjini', 'Kakese', 'Kawanzige', 'Ilembo'] },
            { name: 'Tanganyika', wards: ['Mwese', 'Karema'] },
            { name: 'Mlele', wards: ['Inyonga', 'Utende'] },
        ],
    },
];

// Helper to look up region by name
export function findRegion(name: string): RegionInfo | undefined {
    if (!name || name === 'all') return undefined;
    const clean = name.toLowerCase().trim();
    return TANZANIA_REGIONS.find(
        (r) =>
            r.name.toLowerCase() === clean ||
            r.swahiliName.toLowerCase() === clean ||
            clean.includes(r.name.toLowerCase()) ||
            r.name.toLowerCase().includes(clean)
    );
}

// Get all districts for a given region (or all districts across Tanzania if 'all')
export function getDistrictsForRegion(regionName: string): string[] {
    if (!regionName || regionName === 'all') {
        // Return popular / all districts
        const districts: string[] = [];
        TANZANIA_REGIONS.forEach((r) => {
            r.districts.forEach((d) => {
                if (!districts.includes(d.name)) districts.push(d.name);
            });
        });
        return districts;
    }

    const reg = findRegion(regionName);
    if (!reg) return [];
    return reg.districts.map((d) => d.name);
}

// Get wards for a specific district in a region
export function getWardsForDistrict(regionName: string, districtName: string): string[] {
    if (!districtName || districtName === 'all') return [];
    const reg = findRegion(regionName);
    if (reg) {
        const dist = reg.districts.find(
            (d) => d.name.toLowerCase() === districtName.toLowerCase().trim()
        );
        return dist?.wards || [];
    }

    // If no region specified, search across all regions
    for (const r of TANZANIA_REGIONS) {
        const dist = r.districts.find(
            (d) => d.name.toLowerCase() === districtName.toLowerCase().trim()
        );
        if (dist?.wards?.length) return dist.wards;
    }

    return [];
}
