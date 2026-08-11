// jwt.strategy.ts

import { Injectable, UnauthorizedException } from "@nestjs/common"; // 👈 IMPORTANTE: Desde '@nestjs/common'
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "./constants";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException();
    }

    // Esto es lo que estará disponible en req.user en tus controladores
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role, 
      regionId: payload.regionId,
      region: payload.region,
    };
  }
}