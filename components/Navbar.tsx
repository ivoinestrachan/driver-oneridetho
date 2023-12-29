import Image from "next/image";
import logo from "../assets/logo.svg";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { CiLogout } from "react-icons/ci";


const Navbar = () => {
  const { data: session } = useSession();
  return (
    <div className="bg-black">
      <div className="flex items-center justify-between w-[95%] h-[10vh]">
        <div className="flex items-center">
          <Link href="/">
            <div>
              <Image
                src={logo}
                alt="one ride tho"
                draggable="false"
                height={50}
              />
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-5 text-white ">
          {!session ? (
            <>
             
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div>
                <Link href="/task">
                <Image
                  src={session.user?.image || "https://res.cloudinary.com/dxmrcocqb/image/upload/v1700749220/Social_Media_Chatting_Online_Blank_Profile_Picture_Head_And_Body_Icon_People_Standing_Icon_Grey_Background_generated_qnojdz.jpg"}
                  alt="pfp"
                  height={40}
                  width={40}
                  className="rounded-full"
                />
                </Link>
              </div>
              <div>{session.user?.name}</div>
              <div onClick={() => signOut()}>
              <CiLogout size={24} color="red" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;