export const PET_TYPES = [
    { id: 'dog', label: 'Dog', icon: 'Dog', maxLifespan: 20 },
    { id: 'cat', label: 'Cat', icon: 'Cat', maxLifespan: 25 },
    { id: 'rabbit', label: 'Rabbit', icon: 'Rabbit', maxLifespan: 15 },
    { id: 'bird', label: 'Bird', icon: 'Bird', maxLifespan: 80 },
    { id: 'hamster', label: 'Hamster', icon: 'Hamster', maxLifespan: 5 },
    { id: 'reptile', label: 'Reptile', icon: 'Snake', maxLifespan: 100 },
    { id: 'fish', label: 'Fish', icon: 'Fish', maxLifespan: 30 },
];

export const BREEDS: Record<string, string[]> = {
    dog: [
        'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute',
        'American Bulldog', 'American Staffordshire Terrier', 'Australian Cattle Dog',
        'Australian Shepherd', 'Basenji', 'Basset Hound', 'Beagle', 'Belgian Malinois',
        'Bernese Mountain Dog', 'Bichon Frise', 'Bloodhound', 'Border Collie',
        'Border Terrier', 'Boston Terrier', 'Boxer', 'Boykin Spaniel', 'Brittany',
        'Brussels Griffon', 'Bull Terrier', 'Bulldog', 'Bullmastiff', 'Cairn Terrier',
        'Cane Corso', 'Cavalier King Charles Spaniel', 'Chesapeake Bay Retriever',
        'Chihuahua', 'Chinese Crested', 'Chow Chow', 'Cocker Spaniel', 'Collie',
        'Corgi', 'Dachshund', 'Dalmatian', 'Doberman Pinscher', 'Dogo Argentino',
        'English Setter', 'English Springer Spaniel', 'French Bulldog', 'German Shepherd',
        'German Shorthaired Pointer', 'Giant Schnauzer', 'Golden Retriever',
        'Great Dane', 'Great Pyrenees', 'Greyhound', 'Havanese', 'Irish Setter',
        'Irish Wolfhound', 'Italian Greyhound', 'Jack Russell Terrier', 'Japanese Chin',
        'Keeshond', 'Labradoodle', 'Labrador Retriever', 'Lhasa Apso', 'Maltese',
        'Mastiff', 'Miniature Pinscher', 'Miniature Schnauzer', 'Newfoundland',
        'Norwich Terrier', 'Old English Sheepdog', 'Papillon', 'Pekingese',
        'Pembroke Welsh Corgi', 'Pit Bull', 'Pointer', 'Pomeranian', 'Poodle',
        'Portuguese Water Dog', 'Pug', 'Rat Terrier', 'Rhodesian Ridgeback',
        'Rottweiler', 'Saint Bernard', 'Samoyed', 'Schipperke', 'Scottish Terrier',
        'Shetland Sheepdog', 'Shiba Inu', 'Shih Tzu', 'Siberian Husky',
        'Soft Coated Wheaten Terrier', 'Staffordshire Bull Terrier', 'Standard Schnauzer',
        'Tibetan Mastiff', 'Toy Fox Terrier', 'Vizsla', 'Weimaraner',
        'West Highland White Terrier', 'Whippet', 'Wire Fox Terrier', 'Yorkshire Terrier',
        'Mixed Breed'
    ],
    cat: [
        'Abyssinian', 'American Bobtail', 'American Curl', 'American Shorthair',
        'American Wirehair', 'Balinese', 'Bengal', 'Birman', 'Bombay',
        'British Shorthair', 'Burmese', 'Burmilla', 'Chartreux', 'Cornish Rex',
        'Cymric', 'Devon Rex', 'Domestic Long Hair', 'Domestic Medium Hair',
        'Domestic Short Hair', 'Egyptian Mau', 'Exotic Shorthair', 'Havana Brown',
        'Himalayan', 'Japanese Bobtail', 'Javanese', 'Korat', 'LaPerm',
        'Maine Coon', 'Manx', 'Munchkin', 'Nebelung', 'Norwegian Forest Cat',
        'Ocicat', 'Oriental', 'Persian', 'Ragamuffin', 'Ragdoll', 'Russian Blue',
        'Savannah', 'Scottish Fold', 'Selkirk Rex', 'Siamese', 'Siberian',
        'Singapura', 'Snowshoe', 'Somali', 'Sphynx', 'Tonkinese', 'Toyger',
        'Turkish Angora', 'Turkish Van'
    ],
    rabbit: [
        'American', 'American Chinchilla', 'American Fuzzy Lop', 'American Sable',
        'Argente Brun', 'Belgian Hare', 'Beveren', 'Blanc de Hotot', 'Britannia Petite',
        'Californian', 'Champagne d\'Argent', 'Checkered Giant', 'Cinnamon',
        'Crème d\'Argent', 'Dutch', 'Dwarf Hotot', 'Dwarf Papillon', 'English Angora',
        'English Lop', 'English Spot', 'Flemish Giant', 'Florida White',
        'French Angora', 'French Lop', 'Giant Angora', 'Giant Chinchilla',
        'Harlequin', 'Havana', 'Himalayan', 'Holland Lop', 'Jersey Wooly',
        'Lilac', 'Lionhead', 'Mini Lop', 'Mini Rex', 'Mini Satin',
        'Netherland Dwarf', 'New Zealand', 'Palomino', 'Polish', 'Rex',
        'Rhinelander', 'Satin', 'Satin Angora', 'Silver', 'Silver Fox',
        'Silver Marten', 'Standard Chinchilla', 'Tan', 'Thrianta'
    ],
    bird: [
        'African Grey', 'Amazon Parrot', 'Budgerigar (Parakeet)', 'Caique',
        'Canary', 'Cockatiel', 'Cockatoo', 'Conure', 'Dove', 'Eclectus',
        'Finch', 'Lory', 'Lovebird', 'Macaw', 'Parrotlet', 'Pigeon',
        'Pionus', 'Poicephalus', 'Quaker Parakeet', 'Senegal Parrot'
    ],
    hamster: [
        'Syrian', 'Campbell\'s Dwarf', 'Roborovski Dwarf', 'Chinese',
        'Winter White Russian Dwarf'
    ],
    reptile: [
        'Bearded Dragon', 'Ball Python', 'Leopard Gecko', 'Corn Snake',
        'Crested Gecko', 'Turtle', 'Tortoise', 'Iguana', 'Chameleon'
    ],
    fish: [
        'Betta', 'Goldfish', 'Guppy', 'Tetra', 'Angelfish', 'Cichlid',
        'Molly', 'Platy', 'Swordtail', 'Discus'
    ]
};
