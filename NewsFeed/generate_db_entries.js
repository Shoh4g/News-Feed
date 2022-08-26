// assume mongodb is running on localhost and default port
var conn = new Mongo();

var db = conn.getDB("assignment1");

var usernames = ["Amy", "Bob", "Claire", "David", "Eileen", "Frank"]
var passwords = ["123456", "234561", "345612", "456123", "561234", "612345"]
var icons = []

if(db.userList) {
    db.userList.drop()
}

if(db.newsList) {
    db.newsList.drop()
}

for (let username of usernames) {
    icons.push(`images/${username}.png`)
}

for(let i=0; i < usernames.length; i++) {
    db.userList.insert({'name':usernames[i], 'password':passwords[i], 'icon':icons[i]})
}

var headlines = [
        "Trump and right-wing lawyer were part of 'criminal conspiracy' to overturn 2020 election, January 6 committee alleges - CNN",
        "Russian troops enter strategic Ukrainian port of Kherson - Reuters",
        "Former Illinois House Speaker Michael Madigan Charged With Racketeering - NBC Chicago",
        "Maksim Chmerkovskiy returns to US from Ukraine, reunites with Peta Murgatroyd - Page Six",
        "CNN's Jake Tapper decries Boebert's heckling at Biden SOTU address after excusing Pelosi ripping Trump speech - Fox News",
        "Texas judge grants ACLU's request for temporary restraining order on child abuse investigation of trans child and her parents - CNN",
        "Snowflake CEO: Projecting revenue is challenging, so we prefer to give conservative guidance - CNBC",
        "Russia-Ukraine War: What to know on Day 7 of Russian assault - The Associated Press - en Espa\u00f1ol",
        "Mailbag: Where Will Deshaun Watson Play in 2022? - Sports Illustrated",
        "Rep. Van Taylor apologizes for affair with \u2018ISIS bride,\u2019 abruptly drops reelection bid - The Dallas Morning News",
        "Ukraine's Airdrop Tease Spurs Influx of Microdonations - CoinDesk",
        "Exxon exits $4 billion Russia investment over Ukraine attack - CBS News",
        "MLB Lockout Day 90: Disastrous, What Comes Next, CBT Numbers, Failed PR, Collateral Damage - bleachernation.com",
        "White House slaps Belarus with sweeping restrictions, sanctions Russian oil refining - Fox Business",
        "Epic Games acquires Oakland-based Bandcamp and music fans are quite worried - SF Gate",
        "International Criminal Court opens Ukraine war crimes investigation - Axios",
        "A highly changed coronavirus variant was found in deer after nearly a year in hiding, researchers suggest - CNN",
        "Sophie Turner and Joe Jonas Are Having Another Baby - The Cut",
        "EU bars 7 Russian banks from SWIFT, but spares those in energy - Reuters",
        "Autherine Lucy Foster, First Black Student at U. of Alabama, Dies at 92 - The New York Times"
]

var contents = [
        "(CNN)Former President Donald Trump and a right-wing lawyer were part of a criminal conspiracy to overturn the 2020 presidential election, the House select committee investigating the January 6 Capi\u2026",
        "KYIV/KHARKIV, Ukraine, March 3 (Reuters) - Russian troops were in the centre of the Ukrainian port of Kherson on Thursday after a day of conflicting claims over whether Moscow had captured a major ur\u2026",
        "Michael Madigan, the former speaker of the Illinois House and for decades one of the nations most powerful legislators, was charged with a nearly $3 million racketeering and bribery Wednesday, becomi\u2026",
        "Maksim Chmerkovskiy has safely returned to the United States. The Dancing With the Stars alum who has been posting social media updates from his native Ukraine amid Russias invasion emotionally reun\u2026",
        "Jake Tapper attempted to moral-scold Republicans for not condemning the heckling from Rep. Lauren Boebert, R-Colo., during President Biden's State of the Union address as critics called out the CNN a\u2026",
        "Correction: An earlier version of this story incorrectly reported the terms of the temporary restraining order. The order applies only to the plaintiffs in the ACLU suit. A district court judge in T\u2026",
        "Snowflake CEO Frank Slootman told CNBC's Jim Cramer on Wednesday the company prefers to give conservative guidance, saying the way it recognizes revenue creates a considerable amount of uncertainty w\u2026",
        "The number of people who have fled Ukraine since Russian forces invaded on Feb. 24 has reached 1 million, the U.N. refugee agency said Wednesday.  The tide of people fleeing Ukraine by car, train an\u2026",
        "INDIANAPOLIS \u2014 All your answers, right here \u2026 FromAlan C. Chapman(@Mr_Chappy):Based on what the Texans\u2019 GM said at the combine, do they think Deshaun Watson will play for them again, and basically h\u2026",
        "WASHINGTON Rep. Van Taylor apologized Wednesday for an affair with an ex-jihadist dubbed the ISIS bride by British tabloids and abruptly dropped his bid for a third term, conceding the GOP runoff to \u2026",
        "The leader in news and information on cryptocurrency, digital assets and the future of money, CoinDesk is a media outlet that strives for the highest journalistic standards and abides by astrict set \u2026",
        "ExxonMobil is closing its operations in Russia, joining fellow energy giants BP, Equinor and Shell in pulling back from the world's third-largest oil producer after its invasion of\u00a0Ukraine.  Exxon l\u2026",
        "Been putting this one off all day. I\u2019m just so frayed about this \u2013 sad and angry and helpless \u2013 that I don\u2019t really even want to engage with my own emotions about MLB shutting itself down. Every time\u2026",
        "The White House released a fresh round of sanctions on Russia Wednesday as well as its ally, Belarus, for supporting Putin's invasion of Ukraine.\u00a0 Export restrictions on technology and software that\u2026",
        "In the music streaming wars, Bandcamp occupies a Switzerland-like middle ground.The Oakland-based company, which also operated a physical record shop and performance space on Broadway pre-pandemic, h\u2026",
        "The chief prosecutor of the International Criminal Court said Wednesday he will immediately launch an investigation into allegations of war crimes, crimes against humanity or genocide committed in Uk\u2026",
        "(CNN)An Omicron-like variant of the virus that causes Covid-19 -- one that appears to be highly divergent from circulating strains and sticks out on a long branch of the virus' family tree -- has bee\u2026",
        "In some good news this week, multiple outlets are reporting that Sophie Turner, Queen of the North, and Joe Jonas, who some will forever think of as one-third of the Jonas Brothers, are reportedly ex\u2026",
        "BRUSSELS, March 2 (Reuters) - The European Union said on Wednesday it was excluding seven Russian banks from the SWIFT messaging system, but stopped short of including those handling energy payments,\u2026",
        "Thurgood Marshall and Constance Baker Motley of the NAACP Legal Defense and Educational Fund and Arthur Shores, a Black lawyer from Alabama who was experienced in civil rights cases, waged a federal \u2026"
]

var times = [
    ISODate("2022-03-03T04:23:00Z"),
    ISODate("2022-03-03T03:36:00Z"),
    ISODate("2022-03-03T03:21:55Z"),
    ISODate("2022-03-03T01:33:00Z"),
    ISODate("2022-03-03T01:29:39Z"),
    ISODate("2022-03-03T01:20:00Z"),
    ISODate("2022-03-03T01:07:00Z"),
    ISODate("2022-03-03T01:03:13Z"),
    ISODate("2022-03-03T00:58:49Z"),
    ISODate("2022-03-03T00:45:00Z"),
    ISODate("2022-03-03T00:30:00Z"),
    ISODate("2022-03-03T00:29:00Z"),
    ISODate("2022-03-03T00:25:46Z"),
    ISODate("2022-03-03T00:20:02Z"),
    ISODate("2022-03-03T00:15:00Z"),
    ISODate("2022-03-02T23:28:07Z"),
    ISODate("2022-03-02T23:24:00Z"),
    ISODate("2022-03-02T23:20:04Z"),
    ISODate("2022-03-02T23:06:00Z"),
    ISODate("2022-03-02T22:31:55Z")
]

users = db.userList.find({})

for(let i = 0; i < headlines.length; i++) {
    var comments
    if(i == 0) {
        comments = [{ 'userID': users[0]._id,
        'time':ISODate("2022-03-02T22:31:55Z"), 'comment': 'Fantistic!'},
        { 'userID': users[1]._id,
        'time':ISODate("2022-03-02T20:31:55Z"), 'comment': 'Awesome!'}]
    } else {
        comments = []
    }
    db.newsList.insert(
        {'headline': headlines[i],
         'content': contents[i],
         'time': new Date(times[i]),
         'comments': comments
        }
    )
}
