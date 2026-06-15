

class UserService {
  getAllUsers = async (userID) => {
    try {
      const response = await fetch(`http://localhost:8080/user/get/${userID}`, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        console.log("Data is :- ", data);
        return data;
      }
      else {
        throw new Error(response.statusText);
      }
    }
    catch (error) {
      console.error(error);
      throw error;
    }
  }

  connectUser = async (targetId, currentUserId) => {
    try {
      const response = await fetch(`http://localhost:8080/user/get/${targetId}`, { method: "GET" });
      // const data = await response.json();
      console.log(response.ok);
      // console.log("Data is :- ", data);
      if (response.ok) {
        console.log("Inside the correct response :- ");
        const data = await response.json();
        console.log("Data is in connectUSr method :- ", data);
        if (data && data.online) {
          return {
            success: true,
            user: {
              userId: data.userId,
              nickname: data.userId,
              avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.userId)}`,
              status: 'online'
            }
          };
        } else {
          throw new Error("User is offline or does not exist.");
        }
      } else {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.errorMessage || errData?.message || "Failed to connect user.");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
const userService = new UserService();
export default userService;

// Puropose :- It is used to search that weather the searched user id online or not 

// This is the java object returned by this service

// public class SearchResDto {
//     private String userId;
//     private boolean isOnline;
// }