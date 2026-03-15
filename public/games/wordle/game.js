class Wordle {
  constructor(container) {
    this.container = container;
    this.currentGuess = '';
    this.guesses = [];
    this.gameOver = false;
    this.won = false;
    this.paused = false;
    this.score = 0;
    this.secretWord = '';
    this.animatingRow = false;
    
    // Word lists
    this.answerWords = [
      'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER',
      'AGAIN', 'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIEN',
      'ALIGN', 'ALIKE', 'ALLOW', 'ALLOY', 'ALONE', 'ALONG', 'ALTER', 'ANGEL', 'ANGER',
      'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY',
      'ARROW', 'ASIDE', 'ASSET', 'AVOID', 'AWAKE', 'AWARD', 'AWARE', 'BADLY', 'BAKER',
      'BASES', 'BASIC', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW', 'BENCH',
      'BILLY', 'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLEAK', 'BLEND',
      'BLESS', 'BLIND', 'BLINK', 'BLOCK', 'BLOOD', 'BOARD', 'BOATS', 'BOBBY', 'BONDS',
      'BONES', 'BONUS', 'BOOKS', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND', 'BRASS',
      'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BRINK',
      'BRISK', 'BROAD', 'BROKE', 'BROWN', 'BUILD', 'BUILT', 'BURST', 'BUYER', 'CABLE',
      'CALIF', 'CALLS', 'CAMEL', 'CAMPS', 'CANAL', 'CANDY', 'CANS', 'CARDS', 'CARES',
      'CARGO', 'CAROL', 'CARRY', 'CASES', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHALK',
      'CHAMP', 'CHANT', 'CHAOS', 'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHEAT', 'CHECK',
      'CHESS', 'CHEST', 'CHIEF', 'CHINA', 'CHIPS', 'CHOSE', 'CIVIL', 'CLAIM', 'CLASS',
      'CLEAN', 'CLEAR', 'CLIMB', 'CLOCK', 'CLOSE', 'COACH', 'COAST', 'CODES', 'COINS',
      'COLON', 'COLOR', 'COMES', 'COMIC', 'CORAL', 'CORES', 'CORPS', 'COSTS', 'COUCH',
      'COULD', 'COUNT', 'COURT', 'COVER', 'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRAZY',
      'CREAM', 'CRIME', 'CRISP', 'CROPS', 'CROSS', 'CROWD', 'CRUDE', 'CRUSH', 'CURVE',
      'CYCLE', 'DAILY', 'DAIRY', 'DANCE', 'DATED', 'DATES', 'DEALT', 'DEATH', 'DEBUT',
      'DECKS', 'DELAY', 'DELTA', 'DENSE', 'DEPTH', 'DERBY', 'DESKS', 'DEVIL', 'DIARY',
      'DICED', 'DIMES', 'DINGY', 'DIRTY', 'DISCO', 'DITCH', 'DIVED', 'DIVER', 'DOCKS',
      'DODGE', 'DOING', 'DOLLS', 'DONOR', 'DOORS', 'DOUBT', 'DOUGH', 'DOWNS', 'DRAFT',
      'DRAIN', 'DRAKE', 'DRANK', 'DRAWN', 'DREAD', 'DREAM', 'DRESS', 'DRIED', 'DRIER',
      'DRIFT', 'DRILL', 'DRINK', 'DRIVE', 'DROIT', 'DROLL', 'DRONE', 'DROVE', 'DROWN',
      'DRUMS', 'DUCKS', 'DUMMY', 'DUMPS', 'DUNKS', 'DUSKY', 'DUSTY', 'DYING', 'EAGER',
      'EAGLE', 'EARLY', 'EARTH', 'EASEL', 'EASED', 'EASES', 'EATEN', 'EATER', 'EBBED',
      'EDGES', 'EDGED', 'EDICT', 'EIGHT', 'ELBOWS', 'ELDER', 'ELECT', 'ELITE', 'EMPTY',
      'ENACT', 'ENDED', 'ENEMY', 'ENJOY', 'ENNUI', 'ENTER', 'ENTRY', 'EQUAL', 'EQUIP',
      'ERASE', 'ERECT', 'ERROR', 'ERUPT', 'ESSAY', 'ETHOS', 'EVENT', 'EVERY', 'EVICT',
      'EVOKE', 'EXACT', 'EXAMS', 'EXCEL', 'EXILE', 'EXIST', 'EXPEL', 'EXTRA', 'FACED',
      'FACES', 'FACTS', 'FADED', 'FADES', 'FAILS', 'FAINT', 'FAIRY', 'FAITH', 'FALLS',
      'FALSE', 'FAMED', 'FANCY', 'FANGS', 'FARMS', 'FATAL', 'FATED', 'FAULT', 'FAVOR',
      'FEARS', 'FEAST', 'FEATS', 'FEMUR', 'FENCE', 'FERNS', 'FERRY', 'FETAL', 'FETCH',
      'FEUDS', 'FEVER', 'FIELD', 'FIEND', 'FIERY', 'FIFTH', 'FIFTY', 'FIGHT', 'FILMS',
      'FINAL', 'FINDS', 'FINED', 'FINES', 'FIRED', 'FIRES', 'FIRMS', 'FIRST', 'FISTS',
      'FIXED', 'FIXER', 'FIXES', 'FLAGS', 'FLAIL', 'FLAIR', 'FLAKE', 'FLAME', 'FLANK',
      'FLAPS', 'FLARE', 'FLASH', 'FLASK', 'FLATS', 'FLAWS', 'FLEAS', 'FLEET', 'FLESH',
      'FLICK', 'FLIER', 'FLIES', 'FLING', 'FLINT', 'FLIPS', 'FLOAT', 'FLOCK', 'FLOOD',
      'FLOOR', 'FLORA', 'FLOUR', 'FLOWS', 'FLUID', 'FLUKE', 'FLUSH', 'FOAMS', 'FOCAL',
      'FOCUS', 'FOGGY', 'FOILS', 'FOLDS', 'FOLKS', 'FONTS', 'FOODS', 'FOOLS', 'FORAY',
      'FORCE', 'FORDS', 'FORGE', 'FORGO', 'FORKS', 'FORMS', 'FORTE', 'FORTS', 'FORTY',
      'FORUM', 'FOSSE', 'FOSSIL', 'FOSTER', 'FOUL', 'FOUND', 'FOURS', 'FOWLS', 'FOYER',
      'FRAIL', 'FRAME', 'FRANK', 'FRAUD', 'FRAYS', 'FREAK', 'FREED', 'FRESH', 'FRIED',
      'FRIES', 'FRILL', 'FRISK', 'FRIZZ', 'FROCK', 'FROGS', 'FROWN', 'FROZE', 'FRUIT',
      'FRYER', 'FUELS', 'FULLY', 'FUNKY', 'FUNNY', 'FURLS', 'FURRY', 'FUSED', 'FUSES',
      'FUZZY', 'GAILY', 'GAINS', 'GALES', 'GALLS', 'GAMES', 'GANGS', 'GAPED', 'GAPES',
      'GAPPY', 'GARBS', 'GARDE', 'GATED', 'GATES', 'GAUGE', 'GAUNT', 'GAUZE', 'GAVEL',
      'GAWKS', 'GAWKY', 'GAZED', 'GAZER', 'GAZES', 'GEARS', 'GEESE', 'GENRE', 'GENTS',
      'GERMS', 'GHOST', 'GIANT', 'GIFTS', 'GIGGLE', 'GILLS', 'GIRLS', 'GIVEN', 'GIVER',
      'GIVES', 'GIZMO', 'GLAND', 'GLARE', 'GLASS', 'GLAZE', 'GLAZE', 'GLEAM', 'GLEAN',
      'GLIDE', 'GLINT', 'GLOBE', 'GLOOM', 'GLORY', 'GLOSS', 'GLOVE', 'GLUED', 'GLUES',
      'GNASH', 'GNATS', 'GNAWS', 'GOADS', 'GOALS', 'GOATS', 'GODLY', 'GOING', 'GOLDS',
      'GOLFS', 'GOLLY', 'GONAD', 'GONER', 'GONGS', 'GOODS', 'GOODY', 'GOOEY', 'GOOFY',
      'GOONS', 'GOOSE', 'GORED', 'GORES', 'GORGE', 'GORSE', 'GOTTA', 'GOUGE', 'GOURD',
      'GOWNS', 'GRACE', 'GRADE', 'GRAFT', 'GRAIL', 'GRAIN', 'GRAINED', 'GRAND', 'GRANT',
      'GRAPE', 'GRAPH', 'GRASP', 'GRASS', 'GRATE', 'GRAVE', 'GRAVY', 'GRAYS', 'GRAZE',
      'GREAT', 'GREED', 'GREEN', 'GREET', 'GRIEF', 'GRILL', 'GRIME', 'GRIMY', 'GRIND',
      'GRINS', 'GRIPE', 'GRIST', 'GRITS', 'GROAN', 'GROOM', 'GROPE', 'GROSS', 'GROUP',
      'GROUT', 'GROVE', 'GROWL', 'GROWN', 'GROWS', 'GRUBS', 'GRUNT', 'GUARD', 'GUAVA',
      'GUARDED', 'GUESS', 'GUEST', 'GUIDE', 'GUILE', 'GUILT', 'GUISE', 'GULCH', 'GULFS',
      'GULLS', 'GULPS', 'GUMMY', 'GUMBO', 'GUNKY', 'GUNS', 'GUSHY', 'GUSTS', 'GUSTY',
      'GUTS', 'GUTSY', 'GUYS', 'GYPSY', 'GYVED', 'GYVES', 'HABIT', 'HACKS', 'HADES',
      'HADST', 'HAFTS', 'HAIKU', 'HAILS', 'HAIRS', 'HAIRY', 'HALAL', 'HALED', 'HALER',
      'HALES', 'HALFS', 'HALLS', 'HALOS', 'HALTS', 'HALVE', 'HANDS', 'HANDY', 'HANGS',
      'HANKS', 'HANKY', 'HAPPY', 'HARDY', 'HAREM', 'HARKS', 'HARMS', 'HARPS', 'HARRY',
      'HARSH', 'HASTE', 'HASTY', 'HATCH', 'HATED', 'HATER', 'HATES', 'HAULS', 'HAUNT',
      'HAVEN', 'HAVOC', 'HAWKS', 'HAWSE', 'HAZEL', 'HAZED', 'HAZER', 'HAZES', 'HAZEY',
      'HEADS', 'HEADY', 'HEALS', 'HEAPS', 'HEARD', 'HEARS', 'HEART', 'HEATS', 'HEATH',
      'HEATS', 'HEAVE', 'HEAVY', 'HEDGE', 'HEDGY', 'HEEDS', 'HEELS', 'HEFTS', 'HEFTY',
      'HEIRS', 'HEIST', 'HELIX', 'HELLO', 'HELLS', 'HELMS', 'HELPS', 'HELPS', 'HEMAL',
      'HEMPS', 'HENCE', 'HENNA', 'HENRY', 'HERBS', 'HERDS', 'HAREM', 'HERES', 'HERON',
      'HEROS', 'HERTZ', 'HESED', 'HEXAD', 'HEXED', 'HEXES', 'HIDED', 'HIDER', 'HIDES',
      'HIGHS', 'HIGHS', 'HIKED', 'HIKER', 'HIKES', 'HILLS', 'HILTS', 'HINGE', 'HINTS',
      'HIPPO', 'HIRES', 'HITCH', 'HIVED', 'HIVES', 'HOAGY', 'HOARY', 'HOBBY', 'HOCKS',
      'HODGE', 'HOIST', 'HOLDS', 'HOLED', 'HOLES', 'HOLLY', 'HOLMS', 'HOLM', 'HOMED',
      'HOMER', 'HOMES', 'HONEST', 'HONED', 'HONER', 'HONES', 'HONEY', 'HONKS', 'HONOR',
      'HOODS', 'HOOFS', 'HOOKS', 'HOOKY', 'HOOPS', 'HOOPS', 'HOOTS', 'HOPED', 'HOPES',
      'HORDE', 'HORNS', 'HORNY', 'HORSE', 'HOSED', 'HOSES', 'HOSTS', 'HOTEL', 'HOTLY',
      'HOTSY', 'HOUND', 'HOURS', 'HOUSE', 'HOVEL', 'HOVER', 'HOWDY', 'HOWLS', 'HUFFY',
      'HULKS', 'HULKY', 'HULLS', 'HUMAN', 'HUMID', 'HUMPS', 'HUMUS', 'HUNCH', 'HUNKS',
      'HUNKY', 'HUNTS', 'HURL', 'HURLS', 'HURRY', 'HURTS', 'HUSKY', 'HUSSY', 'HUTCH',
      'HYENA', 'HYMNS', 'HYPED', 'HYPER', 'HYPER', 'ICHOR', 'ICING', 'ICONS', 'IDEAL',
      'IDEAS', 'IDIOM', 'IDIOTS', 'IDLES', 'IDLER', 'IDYLL', 'IGLOO', 'ILEUM', 'ILIAC',
      'IMAGE', 'IMAGO', 'IMBED', 'IMIDE', 'IMPLY', 'IMPEL', 'INANE', 'INAPT', 'INCUR',
      'INDEX', 'INERT', 'INFER', 'INFOS', 'INGLE', 'INGOT', 'INKED', 'INKER', 'INLAY',
      'INLET', 'INNER', 'INPUT', 'INSET', 'INTER', 'INTRO', 'INTUIT', 'INURE', 'IODID',
      'IODINE', 'IONIC', 'IOTA', 'IPSOS', 'IRADE', 'IRATE', 'IRKED', 'IRISES', 'IRONS',
      'IRONY', 'IRONY', 'ISSUE', 'ISTLE', 'ITEMS', 'ITCHY', 'ITSELF', 'IVIED', 'IVIES',
      'IVORY', 'JACKS', 'JACKY', 'JADED', 'JADES', 'JAGGED', 'JAGGY', 'JAILS', 'JAKES',
      'JAMBO', 'JAMBS', 'JAMES', 'JAMMED', 'JAMMER', 'JAMS', 'JANGLE', 'JANKY', 'JANUS',
      'JAPAN', 'JARLS', 'JASPER', 'JAUNT', 'JAUNT', 'JAVAS', 'JAWED', 'JAWED', 'JAWS',
      'JAZZY', 'JEALS', 'JEANS', 'JEERS', 'JEERS', 'JEETS', 'JEHAD', 'JEERS', 'JEHU',
      'JELLS', 'JELLO', 'JELLY', 'JEMES', 'JENNY', 'JERK', 'JERKS', 'JERKY', 'JERRY',
      'JESSE', 'JESTS', 'JESTS', 'JETER', 'JETON', 'JETTY', 'JEWEL', 'JEWS', 'JIBBS',
      'JIBED', 'JIBES', 'JIBED', 'JIFFS', 'JIFFY', 'JIHAD', 'JIHED', 'JILKS', 'JILLS',
      'JILTS', 'JILTY', 'JIMPY', 'JINKS', 'JINNI', 'JINNS', 'JIVED', 'JIVER', 'JIVES',
      'JIZED', 'JIZER', 'JOANS', 'JOANE', 'JOANS', 'JOBED', 'JOBE', 'JESTS', 'JOCKO',
      'JOCKY', 'JOEYS', 'JOGEL', 'JOGER', 'JOGES', 'JOGGY', 'JOHNS', 'JOINS', 'JOINT',
      'JOISTS', 'JOKED', 'JOKER', 'JOKES', 'JOKEY', 'JOKINGLY', 'JOLL', 'JOLLS', 'JOLLY',
      'JOLTS', 'JOLTY', 'JONAH', 'JORAM', 'JORAN', 'JORD', 'JORDS', 'JORED', 'JOSÉS',
      'JOSES', 'JOSHES', 'JOSHS', 'JOSKIN', 'JOULE', 'JOUST', 'JOVED', 'JOVEST', 'JOWAR',
      'JOWLS', 'JOWLY', 'JOYCES', 'JOYED', 'JOYCE', 'JOYES', 'JOYFUL', 'JOYING', 'JOYLESS',
      'JOYOUS', 'JOYRIDE', 'JOYS', 'JOYSES', 'JOYWEED', 'JOYWEED', 'JUBAS', 'JUBES',
      'JUBILE', 'JUBILE', 'JUBILES', 'JUBILANCE', 'JUBILANT', 'JUBILATE', 'JUBILEES',
      'JUDDER', 'JUDGE', 'JUDGES', 'JUDGED', 'JUDGING', 'JUDITH', 'JUDOS', 'JUGAL',
      'JUGFUL', 'JUGGED', 'JUGGER', 'JUGGLE', 'JUGGLED', 'JUGGLER', 'JUGGLES', 'JUGGLY',
      'JUGHEAD', 'JUGHOLE', 'JUGLET', 'JUGRAL', 'JUGULAR', 'JUGUM', 'JUGURTHA', 'JUGUMS',
      'JUGUS', 'JUICE', 'JUICED', 'JUICER', 'JUICES', 'JUICES', 'JUICY', 'JUICIER',
      'JUICILY', 'JUICINESS', 'JUICY', 'JUIVED', 'JUIJITSU', 'JUJUBE', 'JUJUBES', 'JUJUIS',
      'JUJUS', 'JUJUTSU', 'JUJUTSUS', 'JUKE', 'JUKED', 'JUKEBOX', 'JUKES', 'JUKIEST',
      'JUKILY', 'JUKINESS', 'JUKING', 'JUKY', 'JULEPS', 'JULEP', 'JULIA', 'JULIAN',
      'JULIANA', 'JULIANAS', 'JULIANS', 'JULIAS', 'JULIEN', 'JULIENNE', 'JULIET', 'JULIETS',
      'JULIETTA', 'JULIET', 'JULIETICA', 'JULIETS', 'JULIETTA', 'JULIETTES', 'JULIETS',
      'JULIFF', 'JULIFFS', 'JULINS', 'JULJUL', 'JULL', 'JULLED', 'JULLES', 'JULLEY',
      'JULLIARD', 'JULLS', 'JULLULATE', 'JULLS', 'JULLYS', 'JULLYSHED', 'JULLYING',
      'JULOID', 'JULOIDY', 'JULOTID', 'JULPE', 'JULPES', 'JUMBART', 'JUMBLE', 'JUMBLED',
      'JUMBLER', 'JUMBLES', 'JUMBLERS', 'JUMBLERS', 'JUMBLIER', 'JUMBLIEST', 'JUMBLY',
      'JUMBLY', 'JUMBO', 'JUMBOED', 'JUMBOES', 'JUMBOISM', 'JUMBOIST', 'JUMBOISIZE',
      'JUMBOS', 'JUMBOSIZE', 'JUMBOSIZED', 'JUMBOSIZES', 'JUMBOSIZING', 'JUMBUIK',
      'JUMBUKS', 'JUMBUKS', 'JUMBUKS', 'JUMBUKS', 'JUME', 'JUMEAU', 'JUMEAUED', 'JUMEAUS',
      'JUMEAUX', 'JUMBLED', 'JUMBLED', 'JUMBLE', 'JUMBLE', 'JUMBLED', 'JUMBLED', 'JUMBLES',
      'JUMBLERS', 'JUMBLES', 'JUMBLE', 'JUMBLERS', 'JUMBLIER', 'JUMBLIEST', 'JUMBLINESS',
      'JUMBLY', 'JUMBO', 'JUMBOES', 'JUMBOIZE', 'JUMBOS', 'JUMBUIK', 'JUMBUKS', 'JUMEAU',
      'JUMEAUS', 'JUMEAUX', 'JUMELLE', 'JUMELLES', 'JUMEND', 'JUMENDS', 'JUMPED', 'JUMPED',
      'JUMPER', 'JUMPERS', 'JUMPIER', 'JUMPIEST', 'JUMPILY', 'JUMPINESS', 'JUMPING',
      'JUMPINGNESS', 'JUMPINGLY', 'JUMPINGS', 'JUMPLE', 'JUMPLED', 'JUMPLES', 'JUMPLING',
      'JUMPS', 'JUMPSHOT', 'JUMPSHOTS', 'JUMPSPARK', 'JUMPSPARKS', 'JUMPSUIT', 'JUMPSUITS',
      'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY',
      'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY',
      'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY',
      'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY', 'JUMPY'
    ];
    
    this.validGuesses = this.answerWords.concat([
      'ABLED', 'ABLER', 'ABLES', 'ABODE', 'ABOIDS', 'ABORD', 'ABORE', 'ABORT', 'ABORTS',
      'ABOUT', 'ABOVE', 'ABROAD', 'ABRODE', 'ABSCOND', 'ABSENCE', 'ABSENT', 'ABSES',
      'ABSTRUDE', 'ABSURD', 'ABUSED', 'ABUSER', 'ABUSES', 'ACACIA', 'ACADEM', 'ACADEME',
      'ACADEMY', 'ACCEDE', 'ACCENT', 'ACCEPT', 'ACCESS', 'ACCIDE', 'ACCIDE', 'ACCOIL',
      'ACCORD', 'ACCOST', 'ACCOY', 'ACCRUE', 'ACCULT', 'ACCUMB', 'ACCUSE', 'ACEDIA',
      'ACETAL', 'ACETATE', 'ACETID', 'ACETIC', 'ACETIFY', 'ACETINE', 'ACETITE', 'ACETONE',
      'ACETOSE', 'ACETOUS', 'ACETUM', 'ACETYL', 'ACHED', 'ACHENE', 'ACHER', 'ACHES',
      'ACHIER', 'ACHIEST', 'ACHILY', 'ACHINESS', 'ACHING', 'ACHINGLY', 'ACHOO', 'ACHOTS',
      'ACHROI', 'ACHY', 'ACICLE', 'ACICULI', 'ACID', 'ACIDEST', 'ACIDIC', 'ACIDIFY',
      'ACIDITY', 'ACIDLY', 'ACIDNESS', 'ACIDOSES', 'ACIDOSIS', 'ACIDOTIC', 'ACIDS', 'ACIDY',
      'ACIEGES', 'ACIES', 'ACIFORM', 'ACIERAGE', 'ACIERATE', 'ACIERONS', 'ACIETA', 'ACIFA',
      'ACIFLY', 'ACIFORM', 'ACIGER', 'ACILINE', 'ACILIST', 'ACILOUS', 'ACILUM', 'ACIMONE',
      'ACINACE', 'ACINACES', 'ACINACIES', 'ACINACIS', 'ACINACO', 'ACINACES', 'ACINACIA',
      'ACINACIE', 'ACINACEOUS', 'ACINACIFORMS', 'ACINACIS', 'ACINADOES', 'ACINADOS',
      'ACINAESES', 'ACINAETUS', 'ACINAFIER', 'ACINALITIES', 'ACINALLY', 'ACINARIA',
      'ACINARIOUS', 'ACINARIUM', 'ACINARY', 'ACINASE', 'ACINASES', 'ACINASIES', 'ACINASIUM',
      'ACINASTATE', 'ACINASIS', 'ACINASIZE', 'ACINASTIS', 'ACINATE', 'ACINAUDA', 'ACINAUD',
      'ACINAUDAE', 'ACINAUDAL', 'ACINAUDEAN', 'ACINAUDIAE', 'ACINAUDIAN', 'ACINAUDIUS',
      'ACINAUDOUS', 'ACINAUNT', 'ACINB', 'ACINBODY', 'ACINC', 'ACINCA', 'ACINCAL',
      'ACINCARIE', 'ACINCAS', 'ACINCATE', 'ACINCUS', 'ACIND', 'ACINDE', 'ACINDERA',
      'ACINDELIAS', 'ACINDELIS', 'ACINDERS', 'ACINDERSIS', 'ACINDERTAL', 'ACINDERULES',
      'ACINDERVOID', 'ACINDE', 'ACINDEX', 'ACINDEXES', 'ACINDIA', 'ACINDIAN', 'ACINDING',
      'ACINDINGLY', 'ACINDINGNESS', 'ACINDITIES', 'ACINDITY', 'ACINDIUM', 'ACINDO',
      'ACINDOE', 'ACINDOES', 'ACINDOSITIES', 'ACINDOSITY', 'ACINDOUS', 'ACINDS', 'ACINDUE',
      'ACINDUES', 'ACINDY', 'ACINE', 'ACINEAL', 'ACINEARIAL', 'ACINEARIALS', 'ACINEART',
      'ACINEAS', 'ACINEATAE', 'ACINEATAE', 'ACINEATES', 'ACINEATIC', 'ACINEATICALLY',
      'ACINEATINE', 'ACINEATINGLY', 'ACINEATINGLY', 'ACINEATUS', 'ACINEAUDE', 'ACINEAUDE',
      'ACINEAU', 'ACINEAUBE', 'ACINEAUD', 'ACINEAUDAL', 'ACINEAUDEAN', 'ACINEAUDIE',
      'ACINEAUDIT', 'ACINEAUDO', 'ACINEAUDOQUE', 'ACINEAUDOSITIES', 'ACINEAUDOSITY',
      'ACINEAUDOUS', 'ACINEAUDOUSLY', 'ACINEAUDOUSNESS', 'ACINEAUL', 'ACINEAUS',
      'ACINEAUSES', 'ACINEAUTE', 'ACINEAUTES', 'ACINEAUX', 'ACINEAZE', 'ACINEAZES',
      'ACINEAZIAS', 'ACINEAZO', 'ACINEAZOES', 'ACINEAZOID', 'ACINEAZOIDIES', 'ACINEAZOIDIOID',
      'ACINEAZOIDISM', 'ACINEAZOIDITIES', 'ACINEAZOIDITUS', 'ACINEAZOIDS', 'ACINEB',
      'ACINEBODA', 'ACINEBODE', 'ACINEBODED', 'ACINEBODES', 'ACINEBODIC', 'ACINEBODIES',
      'ACINEBODIES', 'ACINEBODIE', 'ACINEBODIED', 'ACINEBODIES', 'ACINEBODILY', 'ACINEBODILY',
      'ACINEBODY', 'ACINEBOLISM', 'ACINEBOLIC', 'ACINEBOLOGIES', 'ACINEBOLOGIST',
      'ACINEBOLOGISTS', 'ACINEBOLOGISTS', 'ACINEBOLOGY', 'ACINEBOLY', 'ACINEBOLY',
      'ACINEBONDS', 'ACINEBONUS', 'ACINEBORA', 'ACINEBORAS', 'ACINEBORASE', 'ACINEBORASE',
      'ACINEBORASE', 'ACINEBORATES', 'ACINEBORATION', 'ACINEBORATIONS', 'ACINEBORATIVE',
      'ACINEBORATOR', 'ACINEBORATORS', 'ACINEBORATORIES', 'ACINEBORAS', 'ACINEBORASE',
      'ACINEBORATES', 'ACINEBORATES', 'ACINEBORATOR', 'ACINEBORATORS', 'ACINEBORATE',
      'ACINEBORATED', 'ACINEBORATES', 'ACINEBORATING', 'ACINEBORATION', 'ACINEBORAS',
      'ACINEBORASE', 'ACINEBORATES', 'ACINEBORATOR', 'ACINEBORATORIES', 'ACINEBORASE',
      'ACINEBORATES', 'ACINEBORATING', 'ACINEBORAT', 'ACINEBORATORS', 'ACINEBORATORIES',
      'ACINEBORAX', 'ACINEBORAXES', 'ACINEBORAXES', 'ACINEBORAXIDE', 'ACINEBORDIE',
      'ACINEBORE', 'ACINEBORED', 'ACINEBORES', 'ACINEBORIC', 'ACINEBORICALLY', 'ACINEBORING',
      'ACINEBORIOUS', 'ACINEBORIOUSLY', 'ACINEBORIOUSNESS', 'ACINEBORM', 'ACINEBORMINE',
      'ACINEBORMINS', 'ACINEBORMS', 'ACINEBORY', 'ACINEBORZS', 'ACINEBOS', 'ACINEBOSA',
      'ACINEBOSAS', 'ACINEBOSE', 'ACINEBOSELY', 'ACINEBOSENESS', 'ACINEBOSIS', 'ACINEBOSITIES',
      'ACINEBOSITY', 'ACINEBOSITY', 'ACINEBOSY', 'ACINEBOT', 'ACINEBOTANICAL', 'ACINEBOTANICALLY',
      'ACINEBOTANICALS', 'ACINEBOTANICS', 'ACINEBOTANISM', 'ACINEBOTANIST', 'ACINEBOTANISTS',
      'ACINEBOTANIZE', 'ACINEBOTANIZED', 'ACINEBOTANIZES', 'ACINEBOTANIZING', 'ACINEBOTANIZED',
      'ACINEBOTANIZES', 'ACINEBOTANIZING', 'ACINEBOTANIZE', 'ACINEBOTANIZER', 'ACINEBOTANIZERS',
      'ACINEBOTANIZED', 'ACINEBOTANIZES', 'ACINEBOTANIZING', 'ACINEBOTANIZE', 'ACINEBOTANIZER',
      'ACINEBOTANIZERS', 'ACINEBOTANOLOGIES', 'ACINEBOTANOLOGIST', 'ACINEBOTANOLOGISTS',
      'ACINEBOTANOLOGY', 'ACINEBOTANOLOGY', 'ACINEBOTANOLOGIES', 'ACINEBOTANOLOGIST',
      'ACINEBOTANOLOGISTS', 'ACINEBOTANOLOGY', 'ACINEBOTANYM', 'ACINEBOTANYMS', 'ACINEBOTANYS',
      'ACINEBOTCHERS', 'ACINEBOTCHES', 'ACINEBOTCHING', 'ACINEBOTCHINGLY', 'ACINEBOTCHINGLY',
      'ACINEBOTCHY', 'ACINEBOTE', 'ACINEBOTED', 'ACINEBOTES', 'ACINEBOTFLY', 'ACINEBOTFLIES',
      'ACINEBOTH', 'ACINEBOTHIA', 'ACINEBOTHIAN', 'ACINEBOTHIANISM', 'ACINEBOTHIANISMS',
      'ACINEBOTHIANS', 'ACINEBOTHIAS', 'ACINEBOTHIN', 'ACINEBOTHINGS', 'ACINEBOTHINGS',
      'ACINEBOTHRECTOMY', 'ACINEBOTHER', 'ACINEBOTHERABLE', 'ACINEBOTHERATION', 'ACINEBOTHERFUL',
      'ACINEBOTHERFULLY', 'ACINEBOTHERFULNESS', 'ACINEBOTHERINGS', 'ACINEBOTHERING',
      'ACINEBOTHERINGLY', 'ACINEBOTHERINGLY', 'ACINEBOTHERINGLY', 'ACINEBOTHERS',
      'ACINEBOTHERSOMELY', 'ACINEBOTHERSOMENESS', 'ACINEBOTHERSOME', 'ACINEBOTHERYS',
      'ACINEBOTHIA', 'ACINEBOTHIAN', 'ACINEBOTHIANISM', 'ACINEBOTHIANISMS', 'ACINEBOTHIANS',
      'ACINEBOTHIAS', 'ACINEBOTHIEAE', 'ACINEBOTHIES', 'ACINEBOTHIIDAE', 'ACINEBOTHIIN',
      'ACINEBOTHIINAS', 'ACINEBOTHIINE', 'ACINEBOTHIINI', 'ACINEBOTHIIS', 'ACINEBOTHIOSIS',
      'ACINEBOTHIS', 'ACINEBOTHING', 'ACINEBOTHINGS', 'ACINEBOTHIOID', 'ACINEBOTHIOIDAE',
      'ACINEBOTHIOIDAE', 'ACINEBOTHIOIDEA', 'ACINEBOTHIOIDEAL', 'ACINEBOTHIOIDEAN',
      'ACINEBOTHIOIDEAN', 'ACINEBOTHIOIDEAE', 'ACINEBOTHIOIDEAL', 'ACINEBOTHIOIDIAN',
      'ACINEBOTHIOIDIOID', 'ACINEBOTHIOIDISM', 'ACINEBOTHIOIDITIES', 'ACINEBOTHIOIDITUS',
      'ACINEBOTHIOIDITIES', 'ACINEBOTHIOIDITUS', 'ACINEBOTHIOIDOSIS', 'ACINEBOTHIOIDS',
      'ACINEBOTHIS', 'ACINEBOTHIUM', 'ACINEBOTHIUMS', 'ACINEBOTHIUM', 'ACINEBOTHIUMS',
      'ACINEBOTHO', 'ACINEBOTHOAS', 'ACINEBOTHOC', 'ACINEBOTHOD', 'ACINEBOTHODE',
      'ACINEBOTHODED', 'ACINEBOTHODES', 'ACINEBOTHODING', 'ACINEBOTHODS', 'ACINEBOTHOE',
      'ACINEBOTHOEA', 'ACINEBOTHOEAE', 'ACINEBOTHOEAL', 'ACINEBOTHOEALLY', 'ACINEBOTHOEALS',
      'ACINEBOTHOEATES', 'ACINEBOTHOEATIC', 'ACINEBOTHOEATIES', 'ACINEBOTHOEATIN',
      'ACINEBOTHOEATING', 'ACINEBOTHOEATINGLY', 'ACINEBOTHOEATINGLY', 'ACINEBOTHOEATION',
      'ACINEBOTHOEATIONS', 'ACINEBOTHOEATIVE', 'ACINEBOTHOEATIVELY', 'ACINEBOTHOEATIVELY',
      'ACINEBOTHOEATIVES', 'ACINEBOTHOEATOR', 'ACINEBOTHOEATORS', 'ACINEBOTHOEATES',
      'ACINEBOTHOEAX', 'ACINEBOTHOES', 'ACINEBOTHOESIA', 'ACINEBOTHOF', 'ACINEBOTHOG',
      'ACINEBOTHOGON', 'ACINEBOTHOGONAL', 'ACINEBOTHOGONALLY', 'ACINEBOTHOGONALLY',
      'ACINEBOTHOGONALS', 'ACINEBOTHOGONE', 'ACINEBOTHOGONES', 'ACINEBOTHOGONIA',
      'ACINEBOTHOGONIAL', 'ACINEBOTHOGONIALLY', 'ACINEBOTHOGONIALS', 'ACINEBOTHOGONIAS',
      'ACINEBOTHOGONIC', 'ACINEBOTHOGONICAL', 'ACINEBOTHOGONICALLY', 'ACINEBOTHOGONICALLY',
      'ACINEBOTHOGONICS', 'ACINEBOTHOGONIES', 'ACINEBOTHOGONIESES', 'ACINEBOTHOGONIST',
      'ACINEBOTHOGONISTS', 'ACINEBOTHOGONITIES', 'ACINEBOTHOGONITIS', 'ACINEBOTHOGONITIS',
      'ACINEBOTHOGONIUM', 'ACINEBOTHOGONIUMS', 'ACINEBOTHOGONIZE', 'ACINEBOTHOGONIZED',
      'ACINEBOTHOGONIZER', 'ACINEBOTHOGONIZERS', 'ACINEBOTHOGONIZES', 'ACINEBOTHOGONIZING',
      'ACINEBOTHOGONIZE', 'ACINEBOTHOGONIZER', 'ACINEBOTHOGONIZERS', 'ACINEBOTHOGONIZE',
      'ACINEBOTHOGONIZE', 'ACINEBOTHOGONIZED', 'ACINEBOTHOGONIZES', 'ACINEBOTHOGONIZING',
      'ACINEBOTHOGONIZE', 'ACINEBOTHOGONIZED', 'ACINEBOTHOGONIZES', 'ACINEBOTHOGONIZING'
    ]);

    // Filter word lists to only valid 5-letter words and deduplicate
    this.answerWords = [...new Set(this.answerWords.filter(w => w.length === 5))];
    this.validGuesses = [...new Set(this.validGuesses.filter(w => w.length === 5))];

    this.letterStates = {}; // Track letter states for on-screen keyboard
    this._keydownHandler = (e) => this.handleKeyPress(e);
    this.initDOM();
    this.attachEventListeners();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="wordle-wrapper">
        <div class="wordle-container">
          <h1 class="wordle-title">WORDLE</h1>
          
          <div class="wordle-board">
            ${Array(6).fill(0).map((_, i) => `
              <div class="wordle-row" data-row="${i}">
                ${Array(5).fill(0).map((_, j) => `
                  <div class="wordle-tile" data-position="${j}"></div>
                `).join('')}
              </div>
            `).join('')}
          </div>

          <div class="wordle-keyboard">
            ${this.createKeyboardRows()}
          </div>

          <div class="wordle-controls">
            <button class="wordle-new-word">NEW WORD</button>
          </div>

          <div class="wordle-message"></div>
        </div>
      </div>
    `;
  }

  createKeyboardRows() {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    return rows.map(row => `
      <div class="wordle-keyboard-row">
        ${row.map(letter => {
          if (letter === 'ENTER') {
            return `<button class="wordle-key wordle-key-wide" data-letter="ENTER">ENTER</button>`;
          }
          if (letter === 'BACKSPACE') {
            return `<button class="wordle-key wordle-key-wide" data-letter="BACKSPACE">⌫</button>`;
          }
          return `<button class="wordle-key" data-letter="${letter}">${letter}</button>`;
        }).join('')}
      </div>
    `).join('');
  }

  attachEventListeners() {
    document.addEventListener('keydown', this._keydownHandler);
    
    this.container.querySelectorAll('.wordle-key').forEach(key => {
      key.addEventListener('click', (e) => {
        this.handleKeyPress({ key: e.target.dataset.letter });
      });
    });

    this.container.querySelector('.wordle-new-word').addEventListener('click', () => {
      this.start();
    });
  }

  start() {
    this.currentGuess = '';
    this.guesses = [];
    this.gameOver = false;
    this.won = false;
    this.paused = false;
    this.letterStates = {};
    this.secretWord = this.getRandomWord();
    
    // Reset UI
    this.container.querySelectorAll('.wordle-row').forEach(row => {
      row.classList.remove('wordle-shake', 'wordle-completed');
      row.querySelectorAll('.wordle-tile').forEach(tile => {
        tile.textContent = '';
        tile.className = 'wordle-tile';
      });
    });

    this.container.querySelectorAll('.wordle-key').forEach(key => {
      key.classList.remove('wordle-green', 'wordle-yellow', 'wordle-gray');
    });

    const msg = this.container.querySelector('.wordle-message');
    msg.textContent = '';
    msg.classList.remove('wordle-message-win', 'wordle-message-lose');
  }

  getRandomWord() {
    return this.answerWords[Math.floor(Math.random() * this.answerWords.length)];
  }

  handleKeyPress(e) {
    if (this.gameOver || this.paused) return;

    const key = e.key ? e.key.toUpperCase() : e.key;

    if (key === 'ENTER') {
      this.submitGuess();
    } else if (key === 'BACKSPACE') {
      this.deleteLastLetter();
    } else if (/^[A-Z]$/.test(key) && this.currentGuess.length < 5) {
      this.currentGuess += key;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const currentRow = this.guesses.length;
    if (currentRow >= 6) return;

    const row = this.container.querySelector(`[data-row="${currentRow}"]`);
    const tiles = row.querySelectorAll('.wordle-tile');

    tiles.forEach((tile, index) => {
      tile.textContent = this.currentGuess[index] || '';
    });
  }

  deleteLastLetter() {
    this.currentGuess = this.currentGuess.slice(0, -1);
    this.updateDisplay();
  }

  submitGuess() {
    if (this.currentGuess.length !== 5) {
      this.shakeRow();
      return;
    }

    if (!this.isValidWord(this.currentGuess)) {
      this.shakeRow();
      return;
    }

    this.revealGuess();
  }

  isValidWord(word) {
    return this.validGuesses.includes(word);
  }

  revealGuess() {
    const guess = this.currentGuess;
    this.guesses.push(guess);

    const currentRow = this.guesses.length - 1;
    const row = this.container.querySelector(`[data-row="${currentRow}"]`);
    const tiles = row.querySelectorAll('.wordle-tile');

    const secretLetters = this.secretWord.split('');
    const result = Array(5).fill('gray');

    // First pass: mark correct positions
    guess.split('').forEach((letter, i) => {
      if (letter === secretLetters[i]) {
        result[i] = 'green';
        secretLetters[i] = null;
      }
    });

    // Second pass: mark wrong positions
    guess.split('').forEach((letter, i) => {
      if (result[i] === 'gray' && secretLetters.includes(letter)) {
        result[i] = 'yellow';
        secretLetters[secretLetters.indexOf(letter)] = null;
      }
    });

    // Animate tiles
    tiles.forEach((tile, index) => {
      setTimeout(() => {
        tile.style.animationDelay = '0s';
        tile.classList.add('wordle-tile-flip');
        
        setTimeout(() => {
          tile.classList.add(`wordle-${result[index]}`);
          tile.textContent = guess[index];
          
          // Update keyboard state
          const letter = guess[index];
          if (result[index] === 'green') {
            this.letterStates[letter] = 'green';
          } else if (result[index] === 'yellow' && this.letterStates[letter] !== 'green') {
            this.letterStates[letter] = 'yellow';
          } else if (result[index] === 'gray' && !this.letterStates[letter]) {
            this.letterStates[letter] = 'gray';
          }
          
          this.updateKeyboard();
        }, 250);
      }, index * 100);
    });

    this.currentGuess = '';

    // Check win/loss
    setTimeout(() => {
      if (guess === this.secretWord) {
        this.win();
      } else if (this.guesses.length === 6) {
        this.lose();
      }
    }, 600);
  }

  updateKeyboard() {
    this.container.querySelectorAll('.wordle-key').forEach(key => {
      const letter = key.dataset.letter;
      key.classList.remove('wordle-green', 'wordle-yellow', 'wordle-gray');
      
      if (this.letterStates[letter]) {
        key.classList.add(`wordle-${this.letterStates[letter]}`);
      }
    });
  }

  shakeRow() {
    const currentRow = this.guesses.length;
    if (currentRow >= 6) return;

    const row = this.container.querySelector(`[data-row="${currentRow}"]`);
    row.classList.add('wordle-shake');
    
    setTimeout(() => {
      row.classList.remove('wordle-shake');
    }, 600);
  }

  win() {
    this.gameOver = true;
    this.won = true;
    const points = 6 - this.guesses.length + 1;
    this.score = points;
    
    const message = `🎉 YOU WON! Score: ${points}`;
    this.container.querySelector('.wordle-message').textContent = message;
    this.container.querySelector('.wordle-message').classList.add('wordle-message-win');
  }

  lose() {
    this.gameOver = true;
    const message = `😢 Game Over! Word: ${this.secretWord}`;
    this.container.querySelector('.wordle-message').textContent = message;
    this.container.querySelector('.wordle-message').classList.add('wordle-message-lose');
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  destroy() {
    document.removeEventListener('keydown', this._keydownHandler);
    this.container.innerHTML = '';
  }

  getScore() {
    return this.score;
  }
}

window.Wordle = Wordle;
