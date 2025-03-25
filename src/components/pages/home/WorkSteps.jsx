import { motion } from 'framer-motion';
import styles from './WorkSteps.module.css';

const steps = [
  {
    description: "Слушаме вашите изисквания и записваме всички ваши желания, за да реализираме проекта, който желаете."
  },
  {
    description: "Работим върху предварителния проект, за да ви дадем представа какво можем да реализираме, с какви материали и с какви обработки."
  },
  {
    description: "Определяме заедно окончателния проект и избора на материали, с подробности за времето и разходите за изпълнение."
  },
  {
    description: "Започваме работа: изпълняваме обработките и монтажът се извършва с високо качество, съгласно договорения проект."
  }
];

const WorkSteps = () => {
  return (
    <div className="bg-[url('/assets/images/work-steps-bg.jpg')] bg-cover bg-center bg-no-repeat pt-10">
      <div className='mx-auto text-center'> 
        <p className='text-xl tracking-widest text-gray-500 uppercase subtitle'>  Нашият подход </p>
        <h2 className="text-4xl font-extrabold mb-2">
          Открийте как можем да създадем вашия идеален проект
        </h2>
        <p className="text-lg mb-12">
          От избор на камъни до монтаж, ние предоставяме решения от А до Я, които отговарят на вашите нужди.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row items-center justify-between  p-8">


        <div className="lg:w-1/2 p-4 order-2 lg:order-1">
          <motion.img
            src="https://marmogranito.it/wp-content/uploads/2024/10/Prodotti-edilizia-su-misura-MarmoGranito-scaled.jpg.webp"
            alt="Производствен процес"
            className="rounded-lg shadow-lg"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="lg:w-1/2 mt-8 md:mt-0 text-gray-900 order-1 lg:order-2">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="step-container flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <div className='absolute left-0 px-[1rem]'><p className='text-xl text-center h-100'>{index + 1}</p></div>
                <div className='pl-[1rem]'>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </div>

  );
}

export default WorkSteps;
