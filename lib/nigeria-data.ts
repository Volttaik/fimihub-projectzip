export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

export const NIGERIAN_UNIVERSITIES = [
  'Ahmadu Bello University (ABU), Zaria',
  'Ambrose Alli University (AAU), Ekpoma',
  'Babcock University, Ilishan-Remo',
  'Bayero University Kano (BUK)',
  'Benson Idahosa University, Benin',
  'Bingham University, Karu',
  'Covenant University, Ota',
  'Crawford University, Igbesa',
  'Delta State University (DELSU), Abraka',
  'Ebonyi State University (EBSU)',
  'Ekiti State University (EKSU)',
  'Enugu State University (ESUT)',
  'Federal University of Technology Akure (FUTA)',
  'Federal University of Technology Minna (FUTMINNA)',
  'Federal University of Technology Owerri (FUTO)',
  'Fountain University, Osogbo',
  'Igbinedion University, Okada',
  'Imo State University (IMSU)',
  'Joseph Ayo Babalola University (JABU)',
  'Kaduna State University (KASU)',
  'Kogi State University',
  'Lagos State University (LASU)',
  'Landmark University, Omu-Aran',
  'Lead City University, Ibadan',
  'Madonna University, Okija',
  'Michael Okpara University of Agriculture (MOUAU)',
  'Mountain Top University, Ogun',
  'Nnamdi Azikiwe University (UNIZIK), Awka',
  'Obafemi Awolowo University (OAU), Ile-Ife',
  'Pan-Atlantic University, Lagos',
  'Redeemer\'s University, Ede',
  'Rivers State University (RSU)',
  'Salem University, Lokoja',
  'Tai Solarin University of Education (TASUED)',
  'University of Abuja (UNIABUJA)',
  'University of Agriculture Abeokuta (UNAAB)',
  'University of Benin (UNIBEN)',
  'University of Calabar (UNICAL)',
  'University of Ibadan (UI)',
  'University of Ilorin (UNILORIN)',
  'University of Jos (UNIJOS)',
  'University of Lagos (UNILAG)',
  'University of Maiduguri (UNIMAID)',
  'University of Nigeria Nsukka (UNN)',
  'University of Port Harcourt (UNIPORT)',
  'University of Uyo (UNIUYO)',
  'Veritas University, Abuja',
]

export const RENTAL_TYPES = [
  'Self-contain', 'Single Room', '1 Bedroom Flat', '2 Bedroom Flat',
  '3 Bedroom Flat', 'Duplex', 'Bungalow', 'Mini Flat', 'Studio Apartment',
  'Boys Quarters', 'Office Space', 'Shop/Store', 'Warehouse',
]

export const RENTAL_DURATIONS = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Short-term']

export const PRODUCT_CONDITIONS = ['Brand New', 'Fairly Used', 'Refurbished']

export const PRODUCT_TYPES = [
  'Electronics', 'Phones & Tablets', 'Computers & Laptops', 'Fashion & Clothing',
  'Furniture & Home', 'Vehicles & Transport', 'Books & Stationery', 'Sports & Fitness',
  'Baby & Kids', 'Health & Beauty', 'Food & Agriculture', 'Other',
]

export const SERVICE_TYPES = [
  'Tech & IT', 'Design & Creative', 'Construction & Repairs', 'Beauty & Wellness',
  'Cleaning & Laundry', 'Tutoring & Education', 'Legal & Finance', 'Photography & Video',
  'Events & Catering', 'Transport & Logistics', 'Security', 'Other',
]

export const BUSINESS_TYPES = [
  'Food & Restaurant', 'Fashion & Retail', 'Tech Startup', 'Health & Pharmacy',
  'Finance & Investment', 'Real Estate', 'Entertainment', 'Education & Training',
  'Beauty & Salon', 'Agriculture', 'Printing & Media', 'Other',
]

export const SPECIALISATIONS = [
  { id: 'products', label: 'Products', icon: 'ShoppingBag', desc: 'Buy & sell items' },
  { id: 'services', label: 'Services & Skills', icon: 'Wrench', desc: 'Hire or offer expertise' },
  { id: 'rentals', label: 'Apartments & Rentals', icon: 'Home', desc: 'Homes, rooms & spaces' },
  { id: 'business', label: 'Business & Brands', icon: 'Briefcase', desc: 'Promote your business' },
] as const

export type SpecialisationIcon = 'ShoppingBag' | 'Wrench' | 'Home' | 'Briefcase'
