import {
    Card,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"

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


const ReviewCarousel = () => {
  return (
    <div className="w-full py-12 bg-foreground">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-8 text-[var(--text-primary)]">What Our Customers Say</h2>
        <div className="flex overflow-x-auto space-x-6 pb-4">
          {reviewData.map((review) => {
            const charLimit = 200;
            const truncatedText = review.text.length > charLimit 
              ? review.text.substring(0, charLimit) + "..." 
              : review.text;

            return (
                <Card key={review.pk} className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg transform transition-transform hover:-translate-y-1">
                    <CardHeader>
                        <p className="text-gray-700 leading-relaxed">"{truncatedText}"</p>
                    </CardHeader>
                    <CardFooter>
                        <p className="font-semibold text-gray-900">- {review.author_name}</p>
                    </CardFooter>
                </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewCarousel;
