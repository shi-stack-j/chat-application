package com.shiv.chat_bakend.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.time.Duration;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${jwt.secret-key}")
    private String secret;

    @Value("${jwt.expiration-time}")
    private Duration expirationTime;

    private SecretKey getSigningKey(){
        byte[] bytes= Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(bytes);
    }
    public String generateToken(CustomUserDetails userDetails){
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("nickname",userDetails.getNickName())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+expirationTime.toMillis()))
                .signWith(getSigningKey())
                .compact();
    }
    private Claims extractAllClaims(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    private <T> T extractClaim(String token , Function<Claims,T> resolver){
        Claims claims=extractAllClaims(token);
        return resolver.apply(claims);
    }
    public String extractUserName(String token){
        return extractClaim(token,Claims::getSubject);
    }
    public Date extractExpiration(String token){
        return extractClaim(token,Claims::getExpiration);
    }
    public Date extractIssuedAt(String token){
        return extractClaim(token,Claims::getIssuedAt);
    }
    public boolean isExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    public String extractNickName(String token){
        return extractClaim(token,claims -> claims.get("nickname",String.class));
    }
    public boolean validateToken(String token,CustomUserDetails customUserDetails){
        String username=extractUserName(token);
        boolean isExpired=isExpired(token);
        boolean isValid=username.equals(customUserDetails.getUsername());
        return isValid && !isExpired;
    }
}
