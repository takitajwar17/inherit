import { UserProfile } from "@clerk/nextjs";

const ProfilePage = () => {
  return (
    <>
      <div className="flex justify-center w-full mt-6">
        <UserProfile />
      </div>
    </>
  );
};

export default ProfilePage;
