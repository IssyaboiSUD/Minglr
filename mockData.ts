
import { Activity } from './types';

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Eisbachwelle Surfing',
    description: 'Watch or join the surfers at the world-famous stationary wave in the English Garden.',
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1610448721566-473ce9da81d3?q=80&w=800&auto=format&fit=crop',
    location: '48.1432, 11.5878', // Eisbachwelle
    rating: 4.8
  },
  {
    id: '2',
    name: 'Viktualienmarkt Breakfast',
    description: 'Traditional Bavarian breakfast with Weisswurst and pretzels at Munich\'s most famous market.',
    category: 'Food',
    imageUrl: 'https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop',
    location: '48.1351, 11.5761', // Viktualienmarkt
    rating: 4.7
  },
  {
    id: '3',
    name: 'Deutsches Museum',
    description: 'Explore the world\'s largest museum of science and technology.',
    category: 'Culture',
    imageUrl: 'https://images.unsplash.com/photo-1629124403306-69666012480a?q=80&w=800&auto=format&fit=crop',
    location: '48.1301, 11.5833', // Deutsches Museum
    rating: 4.9
  },
  {
    id: '4',
    name: 'Beer Garden at Hirschgarten',
    description: 'Enjoy a cold Radler at the world\'s largest beer garden.',
    category: 'Nightlife',
    imageUrl: 'https://images.unsplash.com/photo-1571261314480-1a74d20473ce?q=80&w=800&auto=format&fit=crop',
    location: '48.1478, 11.5126', // Hirschgarten
    rating: 4.6
  },
  {
    id: '5',
    name: 'Sunset at Olympiapark',
    description: 'Climb the Olympic Hill for a breathtaking view of the city and the Alps.',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1571261313768-47209930f9bc?q=80&w=800&auto=format&fit=crop',
    location: '48.1731, 11.5539', // Olympiapark
    rating: 4.8
  }
];