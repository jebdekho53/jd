import { RequestUser } from '../../common/types';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(user: RequestUser): Promise<{
        success: boolean;
        data: import("./cart.service").CartView | null;
    }>;
    addItem(user: RequestUser, dto: AddCartItemDto, ip: string): Promise<{
        success: boolean;
        data: import("./cart.service").CartView;
    }>;
    updateItem(user: RequestUser, cartItemId: string, dto: UpdateCartItemDto, ip: string): Promise<{
        success: boolean;
        data: import("./cart.service").CartView | null;
    }>;
    removeItem(user: RequestUser, cartItemId: string, ip: string): Promise<{
        success: boolean;
        data: import("./cart.service").CartView | null;
    }>;
    clearCart(user: RequestUser, ip: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
