import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSun, faMoon, faUser, faComments, faMapMarkerAlt, faPhone, 
    faChevronLeft, faChevronRight, faEnvelope 
} from '@fortawesome/free-solid-svg-icons';
import logo from './images/logo.jpg';
const Home = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);
    const [products, setProducts] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    const footerRef = useRef(null);

    const scrollToContact = () => {
        if (footerRef.current) {
            footerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getSlideConfig = useCallback(() => {
        const baseConfig = {
            mobile: {
                width: '100%',
                height: windowWidth < 640 ? '250px' : '400px',
                objectFit: 'cover'
            },
            desktop: {
                width: '100%',
                height: '600px',
                objectFit: 'cover'
            }
        };
        return windowWidth < 768 ? baseConfig.mobile : baseConfig.desktop;
    }, [windowWidth]);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchSlides = async () => {
            const { data, error } = await supabase
                .from('Slides')
                .select('imageUrl');
            
            if (error) {
                console.error('Error fetching slides:', error);
            } else {
                const slideUrls = data.map(slide => slide.imageUrl);
                setSlides(slideUrls);
            }
        };

        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('Products')
                .select('*');
            
            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data);
            }
        };

        fetchSlides();
        fetchProducts();
    }, []);

    useEffect(() => {
        let intervalId;
        if (slides.length > 1) {
            intervalId = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [slides.length]);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
        document.documentElement.classList.toggle('dark', !isDarkMode);
    };

    const inquireProduct = (product) => {
        const createProductInquirySession = async () => {
            try {
                const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                localStorage.setItem('productInquiry', JSON.stringify({
                    productName: product.name,
                    productImage: product.image,
                    productPrice: product.price
                }));
                localStorage.setItem('chatSessionId', sessionId);
                navigate('/chat');
            } catch (error) {
                console.error('Error creating inquiry session:', error);
            }
        };
    
        createProductInquirySession();
    };

    const slideConfig = getSlideConfig();

    return (
        <div className={`min-h-screen flex flex-col bg-amber-50 dark:bg-dark-bg dark:text-dark-text transition-colors ${isDarkMode ? 'dark' : ''}`}>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-card shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img 
                            src={logo} 
                            alt="LAIM BAKERY Logo" 
                            className="h-8 w-8 md:h-10 md:w-10 rounded-full"
                            onError={(e) => {
                                console.error('Error loading logo:', e);
                                e.target.onerror = null;
                            }} 
                        />
                        <h1 className="text-lg md:text-2xl font-bold text-amber-600 dark:text-dark-accent">
                            <Link to="/">LAIM BAKERY AND PASTRY</Link>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            onClick={scrollToContact} 
                            className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Contact Information"
                        >
                            <FontAwesomeIcon 
                                icon={faEnvelope} 
                                className="text-sm md:text-base text-gray-600 dark:text-gray-300" 
                            />
                        </button>

                        <button 
                            onClick={toggleTheme} 
                            className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Toggle Theme"
                        >
                            <FontAwesomeIcon 
                                icon={isDarkMode ? faMoon : faSun} 
                                className="text-sm md:text-base text-amber-500 dark:text-dark-accent" 
                            />
                        </button>
                        <Link 
                            to="/admin" 
                            className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Admin Panel"
                        >
                            <FontAwesomeIcon 
                                icon={faUser} 
                                className="text-sm md:text-base text-gray-600 dark:text-gray-300" 
                            />
                        </Link>
                        <Link 
                            to="/chat" 
                            className="p-1 md:p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Customer Support"
                        >
                            <FontAwesomeIcon 
                                icon={faComments} 
                                className="text-sm md:text-base text-gray-600 dark:text-gray-300" 
                            />
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="relative w-full overflow-hidden mb-8 mt-16" style={slideConfig}>
                <div 
                    className="flex transition-transform duration-500 h-full" 
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.length ? (
                        slides.map((imageUrl, index) => (
                            <div key={index} className="w-full h-full flex-shrink-0">
                                <img 
                                    src={imageUrl} 
                                    alt={`Slide ${index + 1}`} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex-shrink-0 flex justify-center items-center bg-gray-200">
                            <p>No Slides Available</p>
                        </div>
                    )}
                </div>

                {slides.length > 1 && (
                    <>
                        <button 
                            onClick={prevSlide} 
                            className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="text-sm md:text-base" />
                        </button>
                        <button 
                            onClick={nextSlide} 
                            className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronRight} className="text-sm md:text-base" />
                        </button>
                    </>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 md:p-8">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">Fresh Bakes Daily</h2>
                    <p className="text-xs md:text-base text-gray-200">Artisanal Pastries & Custom Cakes</p>
                </div>
            </div>

            <div className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.length > 0 ? (
                        products.map(product => (
                            <div 
                                key={product.id} 
                                className="bg-white dark:bg-dark-card p-4 md:p-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                                <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-36 md:h-48 object-cover rounded-lg mb-2 md:mb-4" 
                                />
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-base md:text-lg font-semibold dark:text-dark-text truncate">{product.name}</h3>
                                    <span className="text-sm md:text-base text-amber-600 dark:text-dark-accent font-bold">₦{product.price}</span>
                                </div>
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-4 line-clamp-2">{product.description}</p>
                                <div className="flex justify-between items-center">
                                    <span 
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            product.status === 'available' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                        }`}
                                    >
                                        {product.status === 'available' ? 'Available' : 'Sold Out'}
                                    </span>
                                    <button 
                                        onClick={() => inquireProduct(product)} 
                                        className="px-2 py-1 text-xs md:px-3 md:py-1 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
                                    >
                                        Inquire
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center p-6 rounded-lg bg-white dark:bg-dark-card shadow-lg">
                            <h3 className="text-lg font-semibold dark:text-dark-text">No Products Available</h3>
                            <p className="text-gray-600 dark:text-gray-400">Currently, there are no products available for purchase.</p>
                        </div>
                    )}
                </div>
            </div>

            <footer ref={footerRef} className="bg-amber-100 dark:bg-dark-card transition-colors">
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                        <div className="text-center md:text-left">
                            <img 
                                src={logo}
                                alt="LAIM BAKERY Logo" 
                                className="h-16 md:h-24 mx-auto md:mx-0 mb-2 md:mb-4 rounded-full"
                                onError={(e) => {
                                    console.error('Error loading logo:', e);
                                    e.target.onerror = null;
                                }}
                            />
                            <h3 className="text-lg md:text-xl font-bold text-amber-600 dark:text-dark-accent mb-1 md:mb-2">
                                LAIM BAKERY AND PASTRY
                            </h3>
                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                Crafting delicious moments, one pastry at a time.
                            </p>
                        </div>

                        <div className="text-center md:text-right">
                            <h4 className="text-base md:text-lg font-bold text-amber-600 dark:text-dark-accent mb-2 md:mb-4">
                                Contact Us
                            </h4>
                            <div className="space-y-1 md:space-y-2">
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-amber-500 mr-2 text-sm" />
                                    15 Isiak Adetunji Adeleke Free way,<br />
                                    Oke Fia Osogbo
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faPhone} className="text-amber-500 mr-2 text-sm" />
                                    07074588769
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faPhone} className="text-amber-500 mr-2 text-sm" />
                                    07074588770
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-amber-500 mr-2 text-sm" />
                                    info@laimbakery.com
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-amber-500 mr-2 text-sm" />
                                    reservations@laimbakery.com
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-amber-200 dark:border-gray-700">
                        <p className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            © 2024 LAIM BAKERY AND PASTRY. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;