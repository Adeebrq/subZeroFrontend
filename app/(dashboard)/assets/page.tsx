'use client'

import { useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

// Button Component - Fixed interface
interface ButtonProps {
  styles: string;
  text: string;
  handler?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Updated to accept event parameter
}

function Button({ styles, text, handler }: ButtonProps) {
  return (
    <button className={`${styles} cursor-pointer`} onClick={handler}>
      {text}
    </button>
  );
}

// GraphCard Component (without chart)
interface GraphCardProps {
  style: string;
  headingContainerStyle: string;
  headingStyle: string;
  subHeadingStyle: string;
  heading: string;
  subHeading: string;
  graphColor: string;
}

function GraphCard(card: GraphCardProps) {
  return (
    <div className={`${card.style} bg-white rounded-md p-2 border-gray-200/75 shadow-xs min-w-[150px] border-2 lg:overflow-visible md:overflow-visible sm:overflow-scroll flex justify-between items-center gap-3`}>
      <div className={`${card.headingContainerStyle}`}>
        <h3 className={`${card.headingStyle} font-bold text-[100%]`}>{card.heading}</h3>
        <h4 className={`${card.subHeadingStyle} text-gray-600 font-bold text-[0.8em]`}>{card.subHeading}</h4>
      </div>
      <div className="h-[100%] w-[40%] bg-gray-100 rounded flex items-center justify-center">
        <span className="text-gray-400 text-xs">Chart</span>
      </div>
    </div>
  );
}

// ListCard Component
interface ListItem {
  id: number;
  imgPath: string;
  imgDesc: string;
  imgWidth: number;
  imgHeight: number;
  title: string;
  price: string;
  percent: string;
}

interface ListCardProps {
  style: string;
  heading: string;
  link: string;
  list: ListItem[];
}

function ListCard(card: ListCardProps) {
  return (
    <div className={`${card.style} bg-white rounded-md p-2 border-gray-200/75 shadow-xs border-2 overflow-auto flex flex-col gap-2 justify-between`}>
      <div className="flex justify-between">
        <h3 className="font-black">{card.heading}</h3>
        <Link className="text-gray-800/97 font-black text-[0.85em]" href="">{card.link}</Link>
      </div>
      
      {card.list.map((item) => (
        <div key={item.id} className="flex justify-between items-center flex-1">
          <div className="flex gap-2 items-center">
            <Image src={item.imgPath} alt={item.imgDesc} width={item.imgWidth} height={item.imgHeight} />
            <h5 className="font-black text-[0.9em]">{item.title}</h5>
          </div>
          <p className="text-[0.9em] font-bold">{item.price}<span className="ps-2 text-green-700">{item.percent}</span></p>
        </div>
      ))}
    </div>
  );
}


// Main Page Component
interface CoinData {
  s_no: number;
  coin: {
    name: string;
    imgPath: string;
  };
  price: string;
  hour1: string;
  hour24: string;
  day7: string;
  vol24h: string;
  marketcap: string;
}

function Page() {
  const [activeButton, setActiveButton] = useState('All');
  let filterButtonId = 0;
  let i = 1;
  const filterButtons = ['All', 'Highlights', 'Categories', 'Bridged-Tokens', 'Proof of Work(Pow)', 'World Liberty Financial Portfolio'];

  const filteredListData: CoinData[] = [
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
    {s_no: i++, coin: {name: 'Bitcoin', imgPath: '/bitcoin.svg'}, price: "$113,803", hour1: "0.2%", hour24: "0.9%", day7: "3.1%", vol24h: "$52,739,969,293", marketcap: "$2,264,193,781,393"},
  ];

  const [filteredList, setFilteredList] = useState(filteredListData);

  function filterHandler(event: React.MouseEvent<HTMLButtonElement>, query: string) {
    setActiveButton(event.currentTarget.innerText);
    (query === "Highlights") ? setFilteredList(filteredList.slice(0, 5)) : setFilteredList(filteredListData);
  }

  return (
    <div>
      <div className="p-2.5">
        <div className="flex justify-between items-center">
          <div className="flex gap-7 text-sm font-bold text-gray-700/85 items-center p-">
            {filterButtons.map((name) => <Button key={filterButtonId++} text={name} handler={(e) => filterHandler(e, e.currentTarget.innerText)} styles={clsx('pt-1 pb-1 ps-2 pe-2 rounded-md', {'bg-lime-300/85 text-green-700' : activeButton == filterButtons[filterButtonId]})} />)}
          </div>
        </div>
        <div className="mt-2.5">
          <div className="grid grid-cols-[minmax(0px,_50px)_4fr_repeat(6,_1fr)] auto-rows-max text-right gap-x-5 items-center font-bold text-[0.8em] border-y-1 border-gray-300 pt-2 pb-2">
            <h4 className="font-extrabold">#</h4>
            <h4 className="text-left">Coin</h4>
            <h4>Price</h4>
            <h4>1h</h4>
            <h4>24h</h4>
            <h4>7d</h4>
            <h4>24h Volume</h4>
            <h4>Market Cap</h4>
          </div>
          {filteredList.map((list) => (
            <div key={list.s_no} className="grid grid-cols-[minmax(10px,_50px)_4fr_repeat(6,_1fr)] lg:overflow-visible md:overflow-visible sm:overflow-scroll auto-rows-max text-right gap-x-5 font-bold text-[0.8em] items-center border-b-1 border-gray-300 pt-2 pb-2">
              <h4 className="font-extrabold">{list.s_no}</h4>
              <h4 className="text-left flex justify-between items-center gap-x-7">
                <div className="flex gap-1.5 items-center">
                  <Image src={list.coin.imgPath} alt="Crytocurrency logo" width={20} height={20}></Image>
                  {list.coin.name}
                </div>
                <Button text="Buy" styles="text-lime-600 border-1 rounded-md pt-0.5 pb-0.5 ps-2 pe-2 font-normal" />
              </h4>
              <h4>{list.price}</h4>
              <h4>{list.hour1}</h4>
              <h4>{list.hour24}</h4>
              <h4>{list.day7}</h4>
              <h4>{list.vol24h}</h4>
              <h4>{list.marketcap}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Page;
