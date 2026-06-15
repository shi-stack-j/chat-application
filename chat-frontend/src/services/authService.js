
class AuthService {
  verifyUser = async (userID) => {
    try {
      const response = await fetch(`http://localhost:8080/auth/login/${userID}`, { method: "GET" });
      const data = await response.json().catch(() => null);
      if (response.ok && data) {
        localStorage.setItem(
          "token",
          data.token
        );
        return data;
      }
      else {
        throw new Error(data?.errorMessage || data?.message || "User ID is already occupied or invalid.");
      }
    }
    catch (error) {
      console.error(error);
      throw error;
    }
  }
}
const authService = new AuthService();
export default authService;

// Purpose :- Its purpose is to check weather the provided userID is unqiue or not 
// IF user id is unique then it will return the java object 
// then we have to store the token in the local storage for future use 

// This is the java object returned by this service

// public class LoginResDto {
//     private boolean success;
//     private String userId;
//     private String nickname
//     private String token;
// }
