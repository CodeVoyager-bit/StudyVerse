import Image from "next/image";
import logo from './logo2.png'
export default function Header() {
  return (
    <div style={{display:'flex'}}>
      <Image
        src={logo}
        width={100}
        height={100}
        alt="Picture of the author"
      />
      <h1>StudyVerse</h1>
    </div>
  );
}
