import { Request } from "express";
import { IUser } from "../models/userModel";

export interface IGetUserAuthInfoRequest extends Request {
  user?: IUser
}