// Indian States and Major Cities
const statesAndCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Hyderabad"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Nagaon", "Tinsukia"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Rajnandgaon", "Raigarh"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Jamnagar", "Bhavnagar", "Gandhinagar"],
  "Haryana": ["Faridabad", "Gurgaon", "Hisar", "Rohtak", "Panipat", "Yamunanagar"],
  "Himachal Pradesh": ["Shimla", "Solan", "Mandi", "Kangra", "Kullu"],
  "Jharkhand": ["Ranchi", "Dhanbad", "Giridih", "Jamshedpur", "Bokaro", "Hazaribag"],
  "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubballi", "Belgaum", "Davangere", "Kolar"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kottayam", "Alappuzha"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Ratlam"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Ahmedabad", "Aurangabad", "Nashik", "Kolhapur", "Thane"],
  "Manipur": ["Imphal", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura"],
  "Mizoram": ["Aizawl", "Lunglei"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Rourkela", "Cuttack", "Sambalpur", "Balasore"],
  "Punjab": ["Ludhiana", "Amritsar", "Patiala", "Jalandhar", "Chandigarh", "Mohali"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Bikaner", "Ajmer", "Alwar"],
  "Sikkim": ["Gangtok", "Siliguri"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy", "Tiruppur", "Kanyakumari"],
  "Telangana": ["Hyderabad", "Secunderabad", "Warangal", "Karimnagar", "Nizamabad"],
  "Tripura": ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Noida", "Ghaziabad", "Allahabad"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Almora", "Rishikesh", "Mussoorie"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Darjeeling", "Jalpaiguri"],
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli": ["Silvassa"],
  "Daman and Diu": ["Daman"],
  "Delhi": ["New Delhi", "Delhi"],
  "Lakshadweep": ["Kavaratti"],
  "Puducherry": ["Puducherry", "Yanam", "Karaikal"]
};

// Get all states
function getStates() {
  return Object.keys(statesAndCities).sort();
}

// Get cities for a given state
function getCitiesForState(state) {
  return statesAndCities[state] || [];
}

// Get autocomplete suggestions for state (case-insensitive)
function getStatesSuggestions(input) {
  if (!input) return getStates();
  const lowerInput = input.toLowerCase();
  return getStates().filter(state => state.toLowerCase().includes(lowerInput));
}

// Get autocomplete suggestions for city (for a given state)
function getCitiesSuggestions(state, input) {
  const cities = getCitiesForState(state);
  if (!input) return cities;
  const lowerInput = input.toLowerCase();
  return cities.filter(city => city.toLowerCase().includes(lowerInput));
}
