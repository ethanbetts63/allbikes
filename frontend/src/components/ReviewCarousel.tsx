import { Star } from "lucide-react";

const GOOGLE_REVIEWS_URL = "https://www.google.com/search?sca_esv=c50016dede84fb5a&cs=1&sxsrf=ANbL-n7auNsA8EF9qA71_DeC0xkkejRXgQ:1773338332751&q=Scooter+Shop+Reviews&rflfq=1&num=20&stick=H4sIAAAAAAAAAONgkxIxNDCzMDUxNDAxMjc3tzCysACSGxgZXzGKBCfn55ekFikEZ-QXKASllmWmlhcvYsUqDADhIHceSQAAAA&rldimm=10685410427778288778&tbm=lcl&hl=en-DK&sa=X&ved=2ahUKEwipoY6L-JqTAxXK3AIHHQwDItoQ9fQKegQIEBAG&biw=1440&bih=731&dpr=2#lkt=LocalPoiReviews";

const reviewData = [
  {
    pk: 1,
    author_name: "Philip Okely",
    text: "Thanks Frank for the awesome repair work on my scooter. It was worth the wait when booking into your always busy workshop.\nIt rides like it did when you sold it to me back in 2005.",
    date: "a year ago",
    display_order: 0,
  },
  {
    pk: 5,
    author_name: "Sam",
    text: "Frank is an absolute perfectionist!\nJust chatting with Frank about scooters especially old school 2 strokes you can see how passionate he is about his work.\nI couldnt take my Bee Wee away until I had properly riden her and Frank had gone over her again and again😂.\nAt the Scooter Shop they care about reputation.\nCheers Frank, another happy customer😊",
    date: "2 years ago",
    display_order: 0,
  },
  {
    pk: 4,
    author_name: "Taylor D",
    text: "Frank is the man! Very kind & genuine. Helped me out with a replacement belt & even took time out of his day to demonstrate some things for me. Top bloke!",
    date: "2 years ago",
    display_order: 1,
  },
  {
    pk: 6,
    author_name: "Caitlyn Dunlop",
    text: "I bought my Vespa from the Scooter Shop. Frank and Mary are super helpful and kind people. Going above and beyond for their customers. 10/10 recommend them for your next motorbike!",
    date: "3 years ago",
    display_order: 1,
  },
  {
    pk: 7,
    author_name: "Jackson",
    text: "The guy here is an absolute legend. Has helped me out twice now and its been brilliant both times. I definitely recommend and will be coming back.",
    date: "3 years ago",
    display_order: 1,
  },
  {
    pk: 3,
    author_name: "Trevor John Whitton",
    text: "Frank always has a solution to any scooter probs and he goes out of his way to help out.\nHe does the best services and he shares his rather vast knowledge of scooters and takes his time to explain the why and what he has done on your motor.\nFriendly and great service.  He's a keeper! Well for scootering anyway!\nMost generous with his time a rarity these days.",
    date: "4 years ago",
    display_order: 2,
  },
].sort((a, b) => a.display_order - b.display_order);

const generateAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
};

// Inline Google G logo — path-based to avoid clipPath ID collisions
const GoogleG = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-label="Google">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const scrollbarHideStyle = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const ReviewCarousel = () => {
  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div className="w-full py-8 bg-foreground">
        <div className="container mx-auto px-4">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <div className="flex items-center gap-3">
              <GoogleG size={28} />
              <div>
                <h2 className="text-xl font-semibold text-white leading-tight">Google Reviews</h2>
              </div>
            </div>
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              See all reviews →
            </a>
          </div>

          {/* Cards */}
          <div className="flex overflow-x-auto space-x-4 pb-2 no-scrollbar">
            {reviewData.map((review) => {
              const charLimit = 220;
              const truncatedText = review.text.length > charLimit
                ? review.text.substring(0, charLimit) + "…"
                : review.text;
              const initial = review.author_name.charAt(0).toUpperCase();
              const avatarColor = generateAvatarColor(review.author_name);

              return (
                <a
                  key={review.pk}
                  href={GOOGLE_REVIEWS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-72 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-3"
                >
                  {/* Author row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{review.author_name}</p>
                      </div>
                    </div>
                    <GoogleG size={18} />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#FBBC05] text-[#FBBC05]" />
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="text-sm text-gray-700 leading-relaxed">{truncatedText}</p>
                </a>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
};

export default ReviewCarousel;
