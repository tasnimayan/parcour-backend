import { Response } from "express";
import { ApiResponse } from "../types";

/* 
@class ResponseHandler
@description This class is used to handle responses from the server.
@method success error serverError notFound unauthorized forbidden
*/

export class ResponseHandler {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    meta?: any
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
    });
  }

  static error(
    res: Response,
    message: string,
    error?: string,
    statusCode: number = 400
  ): Response<ApiResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error || message,
    });
  }

  static serverError(
    res: Response,
    message: string = "Internal server error",
    error?: string
  ): Response<ApiResponse> {
    return res.status(500).json({
      success: false,
      message,
      error: error || message,
    });
  }

  static notFound(
    res: Response,
    message: string = "Resource not found"
  ): Response<ApiResponse> {
    return res.status(404).json({
      success: false,
      message,
      error: message,
    });
  }

  static unauthorized(
    res: Response,
    message: string = "Unauthorized access"
  ): Response<ApiResponse> {
    return res.status(401).json({
      success: false,
      message,
      error: message,
    });
  }

  static forbidden(
    res: Response,
    message: string = "Forbidden access"
  ): Response<ApiResponse> {
    return res.status(403).json({
      success: false,
      message,
      error: message,
    });
  }
}
