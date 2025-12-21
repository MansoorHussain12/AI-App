import { FaArrowUp } from 'react-icons/fa';
import { Button } from './ui/button';

const ChatBot = () => {
   return (
      <div className="flex flex-col gap-2 items-end border-2 p-4 rounded-3xl">
         <textarea
            className="w-full resize-none focus:outline-0"
            placeholder="Ask anything"
            maxLength={1000}
         />
         <Button className="w-9 h-9 rounded-full">
            <FaArrowUp />
         </Button>
      </div>
   );
};

export default ChatBot;
