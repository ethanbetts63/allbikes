import {
    Card,
    CardFooter,
} from "@/components/ui/card"
import { Star } from "lucide-react"; // Import Star icon

const reviewData = [
  {
    "pk": 1,
    "author_name": "Philip Okely",
    "text": "Thanks Frank for the awesome repair work on my scooter. It was worth the wait when booking into your always busy workshop.\nIt rides like it did when you sold it to me back in 2005.",
    "display_order": 0
  },
  {
    "pk": 5,
    "author_name": "Sam",
    "text": "Frank is an absolute perfectionist!\nJust chatting with Frank about scooters especially old school 2 strokes you can see how passionate he is about his work.\nI couldnt take my Bee Wee away until I had properly riden her and Frank had gone over her again and again😂.\nAt the Scooter Shop they care about reputation.\nCheers Frank, another happy customer😊",
    "display_order": 0
  },
  {
    "pk": 4,
    "author_name": "Taylor D",
    "text": "Frank is the man! Very kind & genuine. Helped me out with a replacement belt & even took time out of his day to demonstrate some things for me. Top bloke!",
    "display_order": 1
  },
  {
    "pk": 6,
    "author_name": "Caitlyn Dunlop",
    "text": "I bought my Vespa from the Scooter Shop. Frank and Mary are super helpful and kind people. Going above and beyond for their customers. 10/10 recommend them for your next motorbike!",
    "display_order": 1
  },
  {
    "pk": 7,
    "author_name": "Jackson",
    "text": "The guy here is an absolute legend. Has helped me out twice now and its been brilliant both times. I definitely recommend and will be coming back.",
    "display_order": 1
  },
  {
    "pk": 3,
    "author_name": "Trevor John Whitton",
    "text": "Frank always has a solution to any scooter probs and he goes out of his way to help out.\nHe does the best services and he shares his rather vast knowledge of scooters and takes his time to explain the why and what he has done on your motor.\nFriendly and great service.  He's a keeper! Well for scootering anyway!\nMost generous with his time a rarity these days.",
    "display_order": 2
  }
].sort((a, b) => a.display_order - b.display_order);

// Helper function to generate a consistent color based on a string
const generateColorForInitial = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`; // Use HSL for a vibrant color
};

// CSS to hide the scrollbar
const scrollbarHideStyle = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const ReviewCarousel = () => {
  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div className="w-full py-6 bg-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8 text-[var(--text-primary)]">What Our Customers Say</h2>
          <div className="flex overflow-x-auto space-x-6 pb-4 no-scrollbar">
            {reviewData.map((review) => {
              const charLimit = 200;
              const truncatedText = review.text.length > charLimit 
                ? review.text.substring(0, charLimit) + "..." 
                : review.text;
              
              const initial = review.author_name.charAt(0).toUpperCase();
              const backgroundColor = generateColorForInitial(review.author_name);

              return (
                  <Card key={review.pk} className="flex-shrink-0 w-80 bg-white rounded-xl transform transition-transform hover:-translate-y-1 pt-6 px-6 pb-6"> {/* Adjusted padding */}
                      <CardFooter className="flex flex-col items-start p-0">
                          <div className="flex items-center mb-2">
                              <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-[var(--text-primary)] font-bold text-lg"
                                  style={{ backgroundColor: backgroundColor }}
                              >
                                  {initial}
                              </div>
                              <p className="font-semibold text-gray-900">{review.author_name}</p>
                          </div>
                          <div className="flex mb-4">
                              {[...Array(5)].map((_, i) => (
                                  <svg key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true">
                                      <use href="/icons.svg#icon-star" />
                                  </svg>
                              ))}
                          </div>
                          <p className="text-gray-700 leading-relaxed">"{truncatedText}"</p>
                      </CardFooter>
                  </Card>
              );

            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewCarousel;
